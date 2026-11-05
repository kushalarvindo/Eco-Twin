from django.db import models
from django.conf import settings
class Zone(models.Model):
    id=models.SlugField(primary_key=True)
    name=models.CharField(max_length=100)
    kind=models.CharField(max_length=40)
    description=models.TextField()
    map_number=models.IntegerField(null=True)
    latitude=models.FloatField(null=True)
    longitude=models.FloatField(null=True)
    geometry_source=models.URLField(blank=True)
    geometry_note=models.TextField(blank=True)
class Report(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    zone=models.ForeignKey(Zone,on_delete=models.PROTECT)
    title=models.CharField(max_length=120)
    category=models.CharField(max_length=40)
    description=models.TextField()
    image=models.ImageField(upload_to='reports/%Y/%m/')
    status=models.CharField(max_length=20,default='Pending')
    latitude=models.FloatField(null=True)
    longitude=models.FloatField(null=True)
    assignee=models.CharField(max_length=120,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
class ReportUpdate(models.Model):
    report=models.ForeignKey(Report,on_delete=models.CASCADE,related_name='history')
    actor=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True)
    status=models.CharField(max_length=20)
    note=models.TextField(blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
class Reward(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='rewards')
    event=models.CharField(max_length=100,unique=True)
    description=models.CharField(max_length=200)
    points=models.IntegerField()
    created_at=models.DateTimeField(auto_now_add=True)
class Challenge(models.Model):
    title=models.CharField(max_length=100)
    category=models.CharField(max_length=40)
    description=models.TextField()
    instructions=models.TextField()
    points=models.PositiveIntegerField(default=15)
    starts=models.DateField()
    ends=models.DateField()
class Participation(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    challenge=models.ForeignKey(Challenge,on_delete=models.CASCADE)
    status=models.CharField(max_length=20,default='Joined')
    evidence=models.ImageField(upload_to='challenges/%Y/%m/',blank=True)
    note=models.TextField(blank=True)
    review_note=models.TextField(blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:constraints=[models.UniqueConstraint(fields=['user','challenge'],name='one_join_per_challenge')]
class Simulation(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    zone=models.ForeignKey(Zone,on_delete=models.PROTECT)
    title=models.CharField(max_length=120)
    kind=models.CharField(max_length=30)
    inputs=models.JSONField()
    result=models.JSONField()
    created_at=models.DateTimeField(auto_now_add=True)
class Post(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    body=models.TextField()
    zone=models.ForeignKey(Zone,on_delete=models.SET_NULL,null=True)
    created_at=models.DateTimeField(auto_now_add=True)
class Vote(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    post=models.ForeignKey(Post,on_delete=models.CASCADE,related_name='votes')
    class Meta:constraints=[models.UniqueConstraint(fields=['user','post'],name='one_vote_per_post')]

class MeterReading(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.PROTECT)
    meter = models.CharField(max_length=80)
    date = models.DateField()
    reading = models.DecimalField(max_digits=14, decimal_places=3)
    cumulative = models.BooleanField()
    source = models.CharField(max_length=160)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['zone', 'meter', 'date'], name='one_meter_day')]
