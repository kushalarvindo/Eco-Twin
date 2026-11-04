from datetime import date
from io import BytesIO
from pathlib import Path
import json,math,uuid
from PIL import Image,ImageOps,UnidentifiedImageError
from django.conf import settings
from django.contrib.auth import authenticate,login,logout,get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.files.base import ContentFile
from django.db import transaction,IntegrityError
from django.db.models import Sum,Q
from django.http import JsonResponse,FileResponse,Http404
from django.views.decorators.csrf import ensure_csrf_cookie,csrf_protect
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError,PermissionDenied,NotAuthenticated
from rest_framework.response import Response
from .models import Zone,Report,ReportUpdate,Reward,Challenge,Participation,Simulation,Post,Vote
from .simulation import calculate

User=get_user_model()
def require_user(request):
    if not request.user.is_authenticated:raise NotAuthenticated('Sign in to continue.')
def require_staff(request):
    require_user(request)
    if not request.user.is_staff:raise PermissionDenied('Moderator access required.')
def profile(u):
    if not u.is_authenticated:return None
    rewards=u.rewards.order_by('-created_at')
    points=rewards.aggregate(total=Sum('points'))['total'] or 0
    return {'id':u.pk,'username':u.username,'name':u.first_name or u.username,'email':u.email,'moderator':u.is_staff,'points':points,'reports':Report.objects.filter(user=u).count(),'challenges':Participation.objects.filter(user=u,status='Approved').count(),'badges':(['First positive step'] if points>=10 else [])+(['Campus contributor'] if points>=30 else [])+(['Sustainability champion'] if points>=100 else []),'rewards':[{'id':r.pk,'description':r.description,'points':r.points,'created_at':r.created_at.isoformat()} for r in rewards[:40]]}

@ensure_csrf_cookie
@require_http_methods(['GET'])
def session_view(request):return JsonResponse({'user':profile(request.user),'mode':'Local pilot','measured_data_available':False})

@csrf_protect
@require_http_methods(['POST'])
def auth_view(request,action):
    if action not in ['login','register','logout']:raise Http404
    try:data=json.loads(request.body)
    except (ValueError,UnicodeDecodeError):return JsonResponse({'detail':'Invalid request.'},status=400)
    if action=='logout':logout(request);return JsonResponse({'user':None})
    username=str(data.get('username','')).strip().lower()
    password=data.get('password','')
    if not isinstance(password,str) or len(username)>100:return JsonResponse({'detail':'Invalid credentials.'},status=400)
    # Per-session lockout limits repeated login/registration attempts.
    import time
    attempts=request.session.get('auth_attempts',[])
    attempts=[t for t in attempts if time.time()-t<300]
    if len(attempts)>=15:return JsonResponse({'detail':'Too many attempts. Try again in five minutes.'},status=429)
    request.session['auth_attempts']=attempts+[time.time()]
    if action=='register':
        import re
        from django.core.validators import validate_email
        if not re.fullmatch(r'[a-z0-9_.-]{3,40}',username):return JsonResponse({'detail':'Username must be 3–40 letters, numbers, dots, dashes or underscores.'},status=400)
        email=str(data.get('email','')).strip()
        u=User(username=username,email=email,first_name=str(data.get('name','')).strip()[:100])
        try:validate_email(email);validate_password(password,u)
        except DjangoValidationError as e:return JsonResponse({'detail':' '.join(e.messages)},status=400)
        try:u.set_password(password);u.save()
        except IntegrityError:return JsonResponse({'detail':'That username is taken.'},status=400)
    else:
        u=authenticate(request,username=username,password=password)
        if u is None:return JsonResponse({'detail':'Username or password is incorrect.'},status=400)
    login(request,u);request.session['auth_attempts']=[]
    return JsonResponse({'user':profile(u)})

def image_file(file):
    if not file:raise ValidationError('Add a photograph as JPEG or PNG.')
    if file.size>10*1024*1024:raise ValidationError('Photograph must be 10 MB or smaller.')
    try:
        img=Image.open(file)
        if img.format not in ('JPEG','PNG'):raise ValidationError('Use a JPEG or PNG image.')
        if img.width*img.height>25_000_000:raise ValidationError('Image is too large. Use at most 25 megapixels.')
        img.load();img=ImageOps.exif_transpose(img).convert('RGB');img.thumbnail((2000,2000))
        out=BytesIO();img.save(out,format='JPEG',quality=86)
        return ContentFile(out.getvalue(),name=f'{uuid.uuid4().hex}.jpg')
    except (UnidentifiedImageError,OSError,Image.DecompressionBombError):raise ValidationError('This file could not be decoded as a photograph.')

def zone_for(value):
    try:return Zone.objects.get(pk=value)
    except (Zone.DoesNotExist,ValueError,TypeError):raise ValidationError('Choose a valid campus location.')
def text(data,key,minimum=1,maximum=2000):
    val=str(data.get(key,'')).strip()
    if not minimum<=len(val)<=maximum:raise ValidationError(f'{key.capitalize()} must have {minimum}–{maximum} characters.')
    return val
def report_dict(r,request):
    owner=request.user.is_authenticated and (request.user==r.user or request.user.is_staff)
    return {'id':r.pk,'title':r.title,'category':r.category,'description':r.description,'zone':r.zone_id,'zone_name':r.zone.name,'status':r.status,'assignee':r.assignee,'mine':request.user==r.user,'author':r.user.first_name or r.user.username,'created_at':r.created_at.isoformat(),'image':f'/api/reports/{r.pk}/image/','coordinates':{'latitude':r.latitude,'longitude':r.longitude} if owner and r.latitude is not None else None,'history':[{'status':h.status,'note':h.note,'created_at':h.created_at.isoformat()} for h in r.history.all().order_by('created_at')]}
def visible_reports(request):
    qs=Report.objects.select_related('zone','user').prefetch_related('history').order_by('-created_at')
    if request.user.is_authenticated and request.user.is_staff:return qs
    public=Q(status__in=['Verified','Assigned','In Progress','Resolved'])
    if request.user.is_authenticated:public|=Q(user=request.user)
    return qs.filter(public)

@api_view(['GET'])
def bootstrap(request):
    research=settings.BASE_DIR.parent/'RVCE Research'/'data'/'facts.json'
    facts=json.loads(research.read_text(encoding='utf-8')) if research.exists() else []
    facts=[fact for fact in facts if fact.get('topic')!='contact']
    return Response({'zones':list(Zone.objects.values()),'facts':facts,'data_notice':'No current environmental measurements are connected. Campus geometry is schematic. Published claims may be historical.'})

@api_view(['GET','POST'])
def reports(request):
    if request.method=='GET':return Response([report_dict(r,request) for r in visible_reports(request)[:200]])
    require_user(request)
    category=request.data.get('category')
    if category not in ['Waste','Water','Energy','Green spaces','Transport']:raise ValidationError('Choose an issue category.')
    lat=lon=None
    if request.data.get('latitude') is not None and request.data.get('latitude')!='':
        try:lat=float(request.data['latitude']);lon=float(request.data['longitude'])
        except (KeyError,ValueError,TypeError):raise ValidationError('Location coordinates are invalid.')
        if not math.isfinite(lat) or not math.isfinite(lon) or not (-90<=lat<=90 and -180<=lon<=180):raise ValidationError('Coordinates out of range.')
    zone=zone_for(request.data.get('zone'));title=text(request.data,'title',5,120);description=text(request.data,'description',10,2000)
    photo=image_file(request.FILES.get('image'))
    with transaction.atomic():
        r=Report.objects.create(user=request.user,zone=zone,title=title,description=description,category=category,image=photo,latitude=lat,longitude=lon)
        ReportUpdate.objects.create(report=r,actor=request.user,status='Pending',note='Submitted for review.')
    return Response(report_dict(r,request),status=201)

@api_view(['PATCH'])
def report_status(request,pk):
    require_staff(request)
    with transaction.atomic():
        try:r=Report.objects.select_for_update().get(pk=pk)
        except Report.DoesNotExist:raise Http404
        transitions={'Pending':['Verified','Rejected'],'Verified':['Assigned'],'Assigned':['In Progress'],'In Progress':['Resolved']}
        target=request.data.get('status')
        if target not in transitions.get(r.status,[]):raise ValidationError('This status transition is not allowed.')
        note=text(request.data,'note',3,1000)
        if target=='Assigned':r.assignee=text(request.data,'assignee',2,120)
        r.status=target;r.save()
        ReportUpdate.objects.create(report=r,actor=request.user,status=target,note=note)
        if target=='Verified':Reward.objects.get_or_create(event=f'report-{r.pk}',defaults={'user':r.user,'points':10,'description':f'Verified report: {r.title}'})
    return Response(report_dict(r,request))

@api_view(['GET'])
def report_image(request,pk):
    try:r=visible_reports(request).get(pk=pk)
    except Report.DoesNotExist:raise Http404
    if not r.image:raise Http404
    response=FileResponse(r.image.open('rb'),content_type='image/jpeg');response['Cache-Control']='private, no-store';return response

@api_view(['GET'])
def challenges(request):
    joins={p.challenge_id:p for p in Participation.objects.filter(user=request.user)} if request.user.is_authenticated else {}
    return Response([{'id':c.pk,'title':c.title,'category':c.category,'description':c.description,'instructions':c.instructions,'points':c.points,'starts':c.starts,'ends':c.ends,'status':joins[c.pk].status if c.pk in joins else None,'review_note':joins[c.pk].review_note if c.pk in joins else '', 'participants':c.participation_set.count()} for c in Challenge.objects.all().order_by('id')])

@api_view(['POST'])
def participation(request,pk):
    require_user(request)
    try:c=Challenge.objects.get(pk=pk)
    except Challenge.DoesNotExist:raise Http404
    if not c.starts<=date.today()<=c.ends:raise ValidationError('This challenge is outside its participation window.')
    p,_=Participation.objects.get_or_create(user=request.user,challenge=c)
    if request.FILES.get('image'):
        if p.status not in ['Joined','Rejected']:raise ValidationError('Evidence has already been submitted.')
        p.note=text(request.data,'note',10,1500);p.evidence=image_file(request.FILES['image']);p.status='Pending';p.review_note='';p.save()
    return Response({'status':p.status})

@api_view(['GET','PATCH'])
def reviews(request,pk=None):
    require_staff(request)
    if request.method=='GET':return Response([{'id':p.pk,'challenge':p.challenge.title,'user':p.user.first_name or p.user.username,'note':p.note,'image':f'/api/evidence/{p.pk}/','status':p.status} for p in Participation.objects.select_related('user','challenge').filter(status='Pending')])
    with transaction.atomic():
        try:p=Participation.objects.select_for_update().select_related('challenge').get(pk=pk)
        except Participation.DoesNotExist:raise Http404
        if p.status!='Pending' or request.data.get('status') not in ['Approved','Rejected']:raise ValidationError('Evidence is not awaiting this review.')
        p.review_note=text(request.data,'note',3,1000);p.status=request.data['status'];p.save()
        if p.status=='Approved':Reward.objects.get_or_create(event=f'challenge-{p.pk}',defaults={'user':p.user,'points':p.challenge.points,'description':f'Completed: {p.challenge.title}'})
    return Response({'status':p.status})

@api_view(['GET'])
def evidence(request,pk):
    require_user(request)
    try:p=Participation.objects.get(pk=pk)
    except Participation.DoesNotExist:raise Http404
    if not(request.user.is_staff or p.user_id==request.user.pk):raise PermissionDenied()
    if not p.evidence:raise Http404
    res=FileResponse(p.evidence.open('rb'),content_type='image/jpeg');res['Cache-Control']='private, no-store';return res

@api_view(['GET','POST','DELETE'])
def simulations(request,pk=None):
    if request.method!='POST' or request.data.get('save'):require_user(request)
    if request.method=='DELETE':
        count,_=Simulation.objects.filter(pk=pk,user=request.user).delete()
        if not count:raise Http404
        return Response(status=204)
    if request.method=='GET':return Response(list(Simulation.objects.filter(user=request.user).order_by('-created_at').values()))
    zone=zone_for(request.data.get('zone'));kind=request.data.get('kind')
    try:result=calculate(kind,request.data.get('baseline'),request.data.get('reduction'))
    except ValueError as e:raise ValidationError(str(e))
    if request.data.get('save'):
        s=Simulation.objects.create(user=request.user,zone=zone,kind=kind,title=text(request.data,'title',1,120),inputs={'baseline':result['baseline'],'reduction':request.data['reduction'],'data_kind':'illustrative_user_input'},result=result)
        result['id']=s.pk
    return Response(result)

@api_view(['GET','POST'])
def posts(request):
    if request.method=='POST':
        require_user(request);Post.objects.create(user=request.user,body=text(request.data,'body',10,1500),zone=zone_for(request.data['zone']) if request.data.get('zone') else None)
    return Response([{'id':p.pk,'body':p.body,'author':p.user.first_name or p.user.username,'zone_name':p.zone.name if p.zone else 'Campus-wide','votes':p.votes.count(),'voted':request.user.is_authenticated and p.votes.filter(user=request.user).exists(),'created_at':p.created_at} for p in Post.objects.select_related('user','zone').prefetch_related('votes').order_by('-created_at')[:100]])
@api_view(['POST'])
def vote(request,pk):
    require_user(request)
    try:p=Post.objects.get(pk=pk)
    except Post.DoesNotExist:raise Http404
    with transaction.atomic():
        v,created=Vote.objects.get_or_create(user=request.user,post=p)
        if not created:v.delete()
    return Response({'votes':p.votes.count(),'voted':created})
