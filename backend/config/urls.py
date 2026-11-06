from pathlib import Path
from django.urls import path,re_path
from django.conf import settings
from django.http import FileResponse,HttpResponse
from core import fieldwork, analytics, views as v
def frontend(request):
    p=settings.BASE_DIR.parent/'dist'/'index.html'
    return FileResponse(p.open('rb'),content_type='text/html') if p.exists() else HttpResponse('Build the frontend with npm run build, or open http://127.0.0.1:5173.',status=503)
def favicon(request):return FileResponse((settings.BASE_DIR.parent/'public'/'favicon.svg').open('rb'),content_type='image/svg+xml')
urlpatterns=[path('api/surveys/',fieldwork.surveys),path('api/surveys/<int:pk>/',fieldwork.surveys),path('api/surveys/<int:pk>/image/',fieldwork.survey_image),path('api/reports/<int:pk>/confirmation/',fieldwork.confirm_repair),path('api/reports/<int:pk>/repair-image/',fieldwork.repair_image),path('api/analytics/buildings/',analytics.building_history),path('api/analytics/electricity/',analytics.electricity),path('api/session/',v.session_view),path('api/auth/<str:action>/',v.auth_view),path('api/bootstrap/',v.bootstrap),path('api/reports/',v.reports),path('api/reports/<int:pk>/status/',v.report_status),path('api/reports/<int:pk>/image/',v.report_image),path('api/challenges/',v.challenges),path('api/challenges/<int:pk>/join/',v.participation),path('api/reviews/',v.reviews),path('api/reviews/<int:pk>/',v.reviews),path('api/evidence/<int:pk>/',v.evidence),path('api/simulations/',v.simulations),path('api/simulations/<int:pk>/',v.simulations),path('api/posts/',v.posts),path('api/posts/<int:pk>/vote/',v.vote),path('favicon.svg',favicon),re_path(r'^(?!api/).*$',frontend)]
