from datetime import date,timedelta
from io import BytesIO
import tempfile,secrets
from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase,override_settings,Client
from rest_framework.test import APIClient
from .models import Zone,Report,Reward,Challenge,Participation,Simulation
from .simulation import calculate

def photo(name='evidence.png'):
    out=BytesIO();Image.new('RGB',(40,40),'green').save(out,'PNG')
    return SimpleUploadedFile(name,out.getvalue(),content_type='image/png')
class CalculationTests(TestCase):
    def test_known_examples(self):
        for kind,base,pct,expected in [('waste',100,30,70),('energy',1000,15,850),('water',10000,20,8000)]:
            self.assertEqual(calculate(kind,base,pct)['scenario'],expected)
    def test_boundary_inputs(self):
        self.assertEqual(calculate('waste',100,0)['scenario'],100)
        self.assertEqual(calculate('waste',100,100)['scenario'],0)
        self.assertIsNone(calculate('waste',0,30)['percent'])
    def test_invalid_values(self):
        for base,pct in [(-1,10),(100,-1),(100,101),(float('nan'),2),(1,float('inf')),('bad',10),(None,10)]:
            with self.subTest(base=base,pct=pct):
                with self.assertRaises(ValueError):calculate('waste',base,pct)
        with self.assertRaises(ValueError):calculate('carbon',100,30)

class WorkflowTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass();cls.tmp=tempfile.TemporaryDirectory();cls.setting=override_settings(MEDIA_ROOT=cls.tmp.name);cls.setting.enable()
    @classmethod
    def tearDownClass(cls):
        cls.setting.disable();cls.tmp.cleanup();super().tearDownClass()
    def setUp(self):
        self.password=secrets.token_urlsafe(24)
        U=get_user_model()
        self.member=U.objects.create_user('alice',password=self.password)
        self.other=U.objects.create_user('bob',password=self.password)
        self.staff=U.objects.create_user('reviewer',password=self.password,is_staff=True)
        self.zone=Zone.objects.create(id='cse',name='Computer Science',kind='Academic',description='Test zone')
        self.client=APIClient();self.client.force_authenticate(self.member)
    def report(self):
        response=self.client.post('/api/reports/',{'zone':'cse','title':'Test issue for review','category':'Waste','description':'Test-only evidence of a pilot issue.','image':photo()},format='multipart')
        self.assertEqual(response.status_code,201,response.data);return response.data['id']
    def test_report_privacy_moderation_and_rewards(self):
        pk=self.report();url=f'/api/reports/{pk}/status/'
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get('/api/reports/').data,[])
        self.assertEqual(self.client.get(f'/api/reports/{pk}/image/').status_code,404)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get('/api/reports/').data,[])
        self.assertEqual(self.client.patch(url,{'status':'Verified','note':'Looks valid'},format='json').status_code,403)
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.patch(url,{'status':'Resolved','note':'Skip review'},format='json').status_code,400)
        self.assertEqual(self.client.patch(url,{'status':'Verified','note':'Verified evidence'},format='json').status_code,200)
        self.assertEqual(Reward.objects.get(user=self.member).points,10)
        self.assertEqual(self.client.patch(url,{'status':'Verified','note':'Repeat review'},format='json').status_code,400)
        self.assertEqual(Reward.objects.filter(user=self.member).count(),1)
        self.assertEqual(self.client.patch(url,{'status':'Assigned','note':'Assign facilities','assignee':'Facilities'},format='json').status_code,200)
        for status in ['In Progress','Resolved']:
            self.assertEqual(self.client.patch(url,{'status':status,'note':'Updated with test evidence'},format='json').status_code,200)
        self.client.force_authenticate(None)
        self.assertEqual(len(self.client.get('/api/reports/').data),1)
        image_response=self.client.get(f'/api/reports/{pk}/image/');self.assertEqual(image_response.status_code,200);image_response.close()
        self.assertEqual(Report.objects.get(pk=pk).history.count(),5)
    def test_rejection_needs_reason_and_awards_nothing(self):
        pk=self.report();self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.patch(f'/api/reports/{pk}/status/',{'status':'Rejected','note':''},format='json').status_code,400)
        self.assertEqual(self.client.patch(f'/api/reports/{pk}/status/',{'status':'Rejected','note':'Duplicate evidence'},format='json').status_code,200)
        self.assertFalse(Reward.objects.exists())
    def test_file_validation_and_coordinates(self):
        data={'zone':'cse','title':'Test image input','category':'Waste','description':'This upload is not an image.','image':SimpleUploadedFile('x.png',b'not an image',content_type='image/png')}
        self.assertEqual(self.client.post('/api/reports/',data,format='multipart').status_code,400)
        data['image']=photo();data['latitude']='NaN';data['longitude']='77'
        self.assertEqual(self.client.post('/api/reports/',data,format='multipart').status_code,400)
        self.assertEqual(Report.objects.count(),0)
    def test_anonymous_write_denied(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post('/api/reports/',{},format='json').status_code,403)
        self.assertEqual(self.client.get('/api/reviews/').status_code,403)
    def test_simulation_ownership_and_round_trip(self):
        data={'zone':'cse','kind':'energy','baseline':1000,'reduction':15,'save':True,'title':'Test saving'}
        res=self.client.post('/api/simulations/',data,format='json');self.assertEqual(res.status_code,200,res.data)
        pk=res.data['id'];self.assertEqual(res.data['scenario'],850)
        self.assertEqual(len(self.client.get('/api/simulations/').data),1)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get('/api/simulations/').data,[])
        self.assertEqual(self.client.delete(f'/api/simulations/{pk}/').status_code,404)
        self.assertTrue(Simulation.objects.filter(pk=pk).exists())
    def test_challenge_evidence_and_reward_idempotency(self):
        c=Challenge.objects.create(title='Test challenge',category='Waste',description='Test',instructions='Submit test evidence',points=15,starts=date.today(),ends=date.today()+timedelta(days=10))
        url=f'/api/challenges/{c.pk}/join/'
        self.assertEqual(self.client.post(url,{},format='json').status_code,200)
        self.assertEqual(self.client.post(url,{'note':'Test evidence description','image':photo()},format='multipart').status_code,200)
        p=Participation.objects.get();self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(f'/api/evidence/{p.pk}/').status_code,403)
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.patch(f'/api/reviews/{p.pk}/',{'status':'Approved','note':'Verified activity'},format='json').status_code,200)
        self.assertEqual(self.client.patch(f'/api/reviews/{p.pk}/',{'status':'Approved','note':'Repeat activity'},format='json').status_code,400)
        self.assertEqual(Reward.objects.get().points,15)
    def test_vote_toggle_and_text_escaping_contract(self):
        res=self.client.post('/api/posts/',{'body':'A test-only reusable bottle suggestion','zone':'cse'},format='json');self.assertEqual(res.status_code,200)
        pk=res.data[0]['id'];url=f'/api/posts/{pk}/vote/'
        self.assertTrue(self.client.post(url,{},format='json').data['voted'])
        self.assertFalse(self.client.post(url,{},format='json').data['voted'])
        self.assertEqual(self.client.get('/api/posts/').data[0]['votes'],0)
    def test_auth_csrf_registration_and_role_safety(self):
        c=Client(enforce_csrf_checks=True)
        payload={'username':'newperson','name':'New Person','email':'test@example.test','password':self.password,'is_staff':True}
        self.assertEqual(c.post('/api/auth/register/',payload,content_type='application/json').status_code,403)
        c.get('/api/session/');token=c.cookies['csrftoken'].value
        res=c.post('/api/auth/register/',payload,content_type='application/json',HTTP_X_CSRFTOKEN=token)
        self.assertEqual(res.status_code,200,res.content)
        self.assertFalse(get_user_model().objects.get(username='newperson').is_staff)
        self.assertTrue(c.get('/api/session/').json()['user'])
        self.assertEqual(c.post('/api/posts/',{'body':'An authenticated write without a CSRF header.'},content_type='application/json').status_code,403)
    def test_public_calculation_requires_auth_only_to_save(self):
        self.client.force_authenticate(None)
        payload={'zone':'cse','kind':'energy','baseline':1000,'reduction':15}
        response=self.client.post('/api/simulations/',payload,format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual(response.data['scenario'],850)
        self.assertEqual(Simulation.objects.count(),0)
        payload.update(save=True,title='Unauthorised save')
        self.assertEqual(self.client.post('/api/simulations/',payload,format='json').status_code,403)
    def test_upload_is_reencoded_and_does_not_keep_exif(self):
        pk=self.report();r=Report.objects.get(pk=pk)
        with r.image.open('rb') as f:
            image=Image.open(f)
            self.assertEqual(image.format,'JPEG')
            self.assertFalse(image.getexif())
    def test_expired_challenge_cannot_be_joined(self):
        c=Challenge.objects.create(title='Expired test',category='Waste',description='Test',instructions='Test',points=15,starts=date.today()-timedelta(days=10),ends=date.today()-timedelta(days=1))
        self.assertEqual(self.client.post(f'/api/challenges/{c.pk}/join/',{},format='json').status_code,400)
        self.assertEqual(Participation.objects.count(),0)
