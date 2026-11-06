from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from .models import Zone,Report,Reward,SurveySubmission
from .tests import photo

class FieldworkTests(TestCase):
    def setUp(self):
        self.zone=Zone.objects.create(id='cse',name='CSE')
        self.author=get_user_model().objects.create_user('observer')
        self.reviewer=get_user_model().objects.create_user('facilities',is_staff=True)
        self.other=get_user_model().objects.create_user('other')
        self.api=APIClient()

    def test_repair_photo_confirmation_followup_and_reward_once(self):
        report=Report.objects.create(zone=self.zone,user=self.author,status='In Progress',image=photo())
        status=f'/api/reports/{report.pk}/status/'
        self.api.force_authenticate(self.reviewer)
        self.assertEqual(self.api.patch(status,{'status':'Resolved','note':'Work completed'},format='json').status_code,400)
        done=self.api.patch(status,{'status':'Resolved','note':'Work completed','repair_image':photo()},format='multipart')
        self.assertEqual(done.status_code,200)
        response=self.api.get(done.data['repair_image']);self.assertEqual(response.status_code,200);response.close()
        confirm=f'/api/reports/{report.pk}/confirmation/'
        self.api.force_authenticate(self.other)
        self.assertEqual(self.api.post(confirm,{'confirmation':'Confirmed','note':'Fixed today'}).status_code,404)
        self.api.force_authenticate(self.author)
        data={'confirmation':'Confirmed','note':'Checked the tap'}
        self.assertEqual(self.api.post(confirm,data).status_code,200)
        self.assertEqual(self.api.post(confirm,data).status_code,200)
        report.refresh_from_db();self.assertEqual(report.history.filter(note__startswith='Confirmed').count(),1)
        self.assertEqual(self.api.post(confirm,{'confirmation':'Needs follow-up','note':'Leaking again'}).status_code,200)
        report.refresh_from_db();self.assertEqual(report.status,'Verified')
        self.assertEqual(Reward.objects.count(),0)
        self.api.force_authenticate(self.reviewer)
        for status_name in ['Assigned','In Progress']:
            self.assertEqual(self.api.patch(status,{'status':status_name,'note':'Repair follow-up','assignee':'Facilities'}).status_code,200)
        self.assertEqual(self.api.patch(status,{'status':'Resolved','note':'Second repair','repair_image':photo()},format='multipart').status_code,200)
        report.refresh_from_db()
        self.assertEqual(report.confirmation,'')

    def test_survey_visibility_review_and_image_validation(self):
        payload={'zone':'cse','kind':'Height','value':'12.5','description':'Measured from the courtyard on site.'}
        self.assertEqual(self.api.post('/api/surveys/',payload).status_code,403)
        self.api.force_authenticate(self.author)
        created=self.api.post('/api/surveys/',{**payload,'image':photo()},format='multipart')
        self.assertEqual(created.status_code,201)
        pk=created.data['id'];url=f'/api/surveys/{pk}/'
        self.api.force_authenticate(self.other)
        self.assertEqual(self.api.get('/api/surveys/').data,[])
        self.assertEqual(self.api.get(created.data['image']).status_code,404)
        self.assertEqual(self.api.patch(url,{'status':'Approved','note':'Checked on site'}).status_code,403)
        self.api.force_authenticate(self.reviewer)
        self.assertEqual(self.api.patch(url,{'status':'Approved','note':'Checked on site'}).status_code,200)
        self.assertEqual(self.api.patch(url,{'status':'Rejected','note':'Repeated decision'}).status_code,400)
        self.api.force_authenticate(None)
        self.assertEqual(len(self.api.get('/api/surveys/').data),1)
        response=self.api.get(created.data['image']);self.assertEqual(response.status_code,200);response.close()
        self.api.force_authenticate(self.author)
        for bad in ['NaN','Infinity','-1','151']:
            self.assertEqual(self.api.post('/api/surveys/',{**payload,'value':bad,'image':photo()},format='multipart').status_code,400)
        self.assertEqual(SurveySubmission.objects.count(),1)

class PrecisePinTests(TestCase):
    def setUp(self):
        self.zone=Zone.objects.create(id='cse',name='CSE')
        self.author=get_user_model().objects.create_user('pin_author')
        self.other=get_user_model().objects.create_user('pin_other')
        self.staff=get_user_model().objects.create_user('pin_reviewer',is_staff=True)
        self.api=APIClient()

    def test_map_pin_visibility_is_explicit_and_campus_bounded(self):
        import json
        from django.conf import settings
        campus=json.loads((settings.BASE_DIR.parent/'frontend/src/campus-geographic.json').read_text(encoding='utf-8'))
        lon,lat=campus['origin_lon_lat']
        self.api.force_authenticate(self.author)
        payload={'zone':'cse','title':'Pin permission check','category':'Water','description':'Photograph of a location selected on the campus map.','latitude':lat,'longitude':lon,'map_pin':'true'}
        private=self.api.post('/api/reports/',{**payload,'image':photo()},format='multipart')
        public=self.api.post('/api/reports/',{**payload,'image':photo(),'location_public':'on'},format='multipart')
        self.assertEqual(private.status_code,201)
        self.assertEqual(public.status_code,201)
        for item in [private,public]:
            self.assertIsNotNone(item.data['coordinates'])
            Report.objects.filter(pk=item.data['id']).update(status='Verified')
        self.api.force_authenticate(self.other)
        reports={r['id']:r for r in self.api.get('/api/reports/').data}
        self.assertIsNone(reports[private.data['id']]['coordinates'])
        self.assertIsNotNone(reports[public.data['id']]['coordinates'])
        self.api.force_authenticate(self.staff)
        reports={r['id']:r for r in self.api.get('/api/reports/').data}
        self.assertIsNotNone(reports[private.data['id']]['coordinates'])
        self.api.force_authenticate(self.author)
        invalid=self.api.post('/api/reports/',{**payload,'longitude':0,'image':photo()},format='multipart')
        self.assertEqual(invalid.status_code,400)
