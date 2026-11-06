from django.db import transaction
from django.db.models import Q
from django.http import FileResponse, Http404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import Report, ReportUpdate, SurveySubmission
from .views import require_user, require_staff, text, zone_for, image_file, visible_reports, report_dict


@api_view(['GET'])
def repair_image(request, pk):
    try:
        r = visible_reports(request).get(pk=pk)
    except Report.DoesNotExist:
        raise Http404
    if not r.repair_image:
        raise Http404
    response = FileResponse(r.repair_image.open('rb'), content_type='image/jpeg')
    response['Cache-Control'] = 'private, no-store'
    return response


@api_view(['POST'])
def confirm_repair(request, pk):
    require_user(request)
    with transaction.atomic():
        try:
            report = Report.objects.select_for_update().get(pk=pk, user=request.user)
        except Report.DoesNotExist:
            raise Http404
        if report.status != 'Resolved':
            raise ValidationError('The report must be resolved first.')
        confirmation = request.data.get('confirmation')
        if confirmation not in ('Confirmed', 'Needs follow-up'):
            raise ValidationError('Choose a confirmation.')
        note = text(request.data, 'note', 3, 500)
        if report.confirmation == confirmation and report.confirmation_note == note:
            return Response(report_dict(report,request))
        report.confirmation, report.confirmation_note = confirmation, note
        if confirmation == 'Needs follow-up':
            report.status = 'Verified'
        report.save()
        ReportUpdate.objects.create(report=report,actor=request.user,status=report.status,note=confirmation+' — '+note)
    return Response(report_dict(report,request))


def survey_dict(s):
    return dict(id=s.pk,zone=s.zone_id,kind=s.kind,value=s.value,description=s.description,status=s.status,review_note=s.review_note,created_at=s.created_at,image=f'/api/surveys/{s.pk}/image/')


def surveys_visible(request):
    qs = SurveySubmission.objects.select_related('zone').order_by('-created_at','-pk')
    if request.user.is_authenticated and request.user.is_staff:
        return qs
    public = Q(status='Approved')
    if request.user.is_authenticated:
        public |= Q(user=request.user)
    return qs.filter(public)


@api_view(['GET', 'POST', 'PATCH'])
def surveys(request, pk=None):
    if request.method == 'GET':
        return Response([survey_dict(s) for s in surveys_visible(request)[:100]])
    if request.method == 'POST':
        require_user(request)
        kind = request.data.get('kind')
        if kind not in ('Name', 'Height', 'Entrance', 'Ramp', 'Barrier'):
            raise ValidationError('Choose a survey type.')
        value = text(request.data,'value',1,160)
        if kind == 'Height':
            try:
                height = float(value)
            except ValueError:
                raise ValidationError('Height must be in metres.')
            if not 0 < height <= 150:
                raise ValidationError('Height must be between 0 and 150 metres.')
        s=SurveySubmission.objects.create(user=request.user,zone=zone_for(request.data.get('zone')),kind=kind,value=value,description=text(request.data,'description',10,2000),image=image_file(request.FILES.get('image')))
        return Response(survey_dict(s),status=201)
    require_staff(request)
    with transaction.atomic():
        try:
            s=SurveySubmission.objects.select_for_update().get(pk=pk)
        except SurveySubmission.DoesNotExist:
            raise Http404
        if s.status != 'Pending':
            raise ValidationError('This survey has already been reviewed.')
        if request.data.get('status') not in ('Approved','Rejected'):
            raise ValidationError('Choose approval or rejection.')
        if s.user_id == request.user.pk:
            raise PermissionDenied('Another reviewer must check your submission.')
        s.status=request.data['status']
        s.review_note=text(request.data,'note',3,500)
        s.reviewer=request.user
        s.save()
    return Response(survey_dict(s))


@api_view(['GET'])
def survey_image(request, pk):
    try:
        s=surveys_visible(request).get(pk=pk)
    except SurveySubmission.DoesNotExist:
        raise Http404
    response=FileResponse(s.image.open('rb'),content_type='image/jpeg')
    response['Cache-Control']='private, no-store'
    return response
