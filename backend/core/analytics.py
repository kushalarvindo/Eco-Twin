from datetime import timedelta
from django.db.models import Count, Min
from django.db.models.functions import TruncWeek
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .models import MeterReading, ReportUpdate
from .views import visible_reports, zone_for


@api_view(['GET'])
def building_history(request):
    zone = zone_for(request.query_params.get('zone'))
    days = request.query_params.get('days', '30')
    category = request.query_params.get('category', '')
    if days not in ('30', '90', 'all') or category not in ('', 'Waste', 'Energy', 'Water', 'Transport', 'Green spaces'):
        raise ValidationError('Invalid date range or category.')
    today = timezone.localdate()
    start = None if days == 'all' else today - timedelta(days=int(days)-1)
    visible = visible_reports(request).order_by()
    if category:
        visible = visible.filter(category=category)
    opened = visible
    resolved = ReportUpdate.objects.filter(report__in=visible, status='Resolved')
    if start:
        opened = opened.filter(created_at__date__gte=start)
        resolved = resolved.filter(created_at__date__gte=start)
    active = opened.exclude(status__in=['Rejected', 'Resolved'])
    counts = {r['zone_id']: r['n'] for r in active.values('zone_id').annotate(n=Count('pk'))}
    local = opened.filter(zone=zone)
    if not start:
        first = local.aggregate(first=Min('created_at'))['first']
        start = timezone.localdate(first) if first else today
    weeks = {}
    monday = start - timedelta(days=start.weekday())
    while monday <= today:
        weeks[monday.isoformat()] = {'week': monday.isoformat(), 'opened': 0, 'resolved': 0}
        monday += timedelta(days=7)
    for key, qs in [('opened', local), ('resolved', resolved.filter(report__zone=zone))]:
        for row in qs.order_by().annotate(week=TruncWeek('created_at')).values('week').annotate(n=Count('pk')):
            weeks[row['week'].date().isoformat()][key] = row['n']
    try:
        page = int(request.query_params.get('page', '1'))
    except ValueError:
        raise ValidationError('Invalid report page.')
    if not 1 <= page <= 1000000:
        raise ValidationError('Invalid report page.')
    rows = local.order_by('-created_at', '-pk').values('id', 'title', 'status', 'category', 'created_at')
    return Response({'counts': counts, 'weeks': list(weeks.values()), 'recent': list(rows[(page-1)*20:page*20]), 'total': local.count()})


@api_view(['GET'])
def electricity(request):
    keys = MeterReading.objects.order_by('zone__name','meter').values('zone_id','zone__name','meter').distinct()
    meters = list(keys)
    if not meters:
        return Response({'meters': [], 'days': [], 'weeks': []})
    zone = request.query_params.get('zone', meters[0]['zone_id'])
    meter = request.query_params.get('meter', meters[0]['meter'])
    records = MeterReading.objects.filter(zone_id=zone,meter=meter).order_by('-date')
    latest = records.first()
    if not latest:
        raise ValidationError('Unknown building or meter.')
    start = latest.date - timedelta(days=29)
    readings = {r.date:r for r in records.filter(date__gte=start-timedelta(days=1))}
    days, weeks = [], {}
    for i in range(30):
        day = start + timedelta(days=i)
        current, prior = readings.get(day), readings.get(day-timedelta(days=1))
        value = None
        if current:
            if not current.cumulative:
                value = current.reading
            elif prior and prior.cumulative and current.reading >= prior.reading:
                value = current.reading-prior.reading
        period_day = day - timedelta(days=1)
        days.append({'date':period_day,'kwh':value,'source':current.source if current else None})
        week = period_day - timedelta(days=period_day.weekday())
        summary = weeks.setdefault(week, {'week':week,'total':0,'covered':0})
        if value is not None:
            summary['total'] += value
            summary['covered'] += 1
    return Response({'meters':meters,'zone':zone,'meter':meter,'days':days,'weeks':list(weeks.values())})
