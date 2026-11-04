from pathlib import Path
import os
from django.core.management.utils import get_random_secret_key
BASE_DIR=Path(__file__).resolve().parent.parent
DEBUG=os.environ.get('DJANGO_DEBUG','1')=='1'
SECRET_KEY=os.environ.get('DJANGO_SECRET_KEY','')
if not SECRET_KEY:
    if not DEBUG: raise RuntimeError('Set DJANGO_SECRET_KEY for production')
    key_file=BASE_DIR/'.dev-secret'
    if not key_file.exists():key_file.write_text(get_random_secret_key())
    SECRET_KEY=key_file.read_text()
ALLOWED_HOSTS=os.environ.get('DJANGO_ALLOWED_HOSTS','127.0.0.1,localhost,testserver').split(',')
CSRF_TRUSTED_ORIGINS=os.environ.get('DJANGO_CSRF_ORIGINS','http://127.0.0.1:5173,http://localhost:5173').split(',')
INSTALLED_APPS=['django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.staticfiles','rest_framework','core']
MIDDLEWARE=['django.middleware.security.SecurityMiddleware','whitenoise.middleware.WhiteNoiseMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.middleware.clickjacking.XFrameOptionsMiddleware']
ROOT_URLCONF='config.urls'
WSGI_APPLICATION='config.wsgi.application'
DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':BASE_DIR/'db.sqlite3','OPTIONS':{'timeout':20}}}
if os.environ.get('POSTGRES_DB'):
    DATABASES={'default':{'ENGINE':'django.db.backends.postgresql','NAME':os.environ['POSTGRES_DB'],'USER':os.environ.get('POSTGRES_USER','ecotwin'),'PASSWORD':os.environ.get('POSTGRES_PASSWORD',''),'HOST':os.environ.get('POSTGRES_HOST','localhost'),'PORT':os.environ.get('POSTGRES_PORT','5432')}}
AUTH_PASSWORD_VALIDATORS=[{'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator'},{'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},{'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'}]
REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES':['rest_framework.authentication.SessionAuthentication'],'DEFAULT_PERMISSION_CLASSES':['rest_framework.permissions.AllowAny'],'DEFAULT_THROTTLE_CLASSES':['rest_framework.throttling.AnonRateThrottle','rest_framework.throttling.UserRateThrottle'],'DEFAULT_THROTTLE_RATES':{'anon':'300/hour','user':'1500/hour'}}
TIME_ZONE='Asia/Kolkata'
USE_TZ=True
LANGUAGE_CODE='en-in'
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
MEDIA_ROOT=Path(os.environ.get('MEDIA_ROOT',str(BASE_DIR/'media')))
STATIC_URL='/assets/'
STATIC_ROOT=BASE_DIR/'staticfiles'
STATICFILES_DIRS=[BASE_DIR.parent/'dist'/'assets'] if (BASE_DIR.parent/'dist'/'assets').exists() else []
WHITENOISE_ROOT=BASE_DIR.parent/'dist'
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE='Lax'
SESSION_COOKIE_SECURE=not DEBUG
CSRF_COOKIE_SECURE=not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF=True
X_FRAME_OPTIONS='DENY'
DATA_UPLOAD_MAX_MEMORY_SIZE=12*1024*1024
FILE_UPLOAD_MAX_MEMORY_SIZE=2*1024*1024
if not DEBUG:
    SECURE_SSL_REDIRECT=os.environ.get('DJANGO_SSL_REDIRECT','1')=='1'
    SECURE_HSTS_SECONDS=31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS=True
    SECURE_HSTS_PRELOAD=True
