from datetime import date,timedelta
from django.core.management.base import BaseCommand,CommandError
from django.contrib.auth import get_user_model
from django.conf import settings
from core.models import Zone,Challenge
import json, secrets, os
class Command(BaseCommand):
    help='Seed schematic campus and challenge templates. Optional local-only demo accounts.'
    def add_arguments(self,p):p.add_argument('--demo',action='store_true')
    def handle(self,*args,**opts):
        zones=[('cse','Computer Science','Academic',12,'A place for ideas, experiments and the next big thing. CSE is location 12 on the historical event map.'),('admin','Administration','Academic',3,'The administrative hub, shown as location 3 on the historical campus event map.'),('library','Central Library','Academic',25,'A quieter corner for learning. The library is marked 25 on the event map.'),('food-court','MINGOS Food Court','Amenities',18,'A shared space to refuel. Published design capacity: 1,000 people; about 500 m². Current usage is unavailable.'),('parking','Pilot parking zone','Transport',None,'An illustrative pilot parking zone. The event map’s Poornima Palace parking is event-specific; permanent campus parking needs confirmation.'),('garden','Pilot green space','Green space',None,'A schematic garden zone for the pilot. Tree locations, canopy area and species require a site survey.')]
        for key,name,kind,num,desc in zones:Zone.objects.update_or_create(id=key,defaults={'name':name,'kind':kind,'map_number':num,'description':desc})
        layout=json.loads((settings.BASE_DIR.parent/'frontend/src/campus-layout.json').read_text(encoding='utf-8'))
        for p in layout['places']:
            desc=f"{p['label']}. Reference {p['number']} on the historical 8th Mile map. Map position is schematic; current use, footprint, height and dimensions require verification."
            if p['number'] is None:desc='A virtual planting study area, not an observed garden location or a verified tree inventory.'
            if p['kind'] in ['Event reference','Event parking','Neighbouring institution']:desc+=' Included for historical map context; this is not a verified permanent RVCE facility.'
            Zone.objects.update_or_create(id=p['id'],defaults={'name':p['label'],'kind':p['kind'],'map_number':p['number'],'description':desc})
        geo=json.loads((settings.BASE_DIR.parent/'frontend/src/campus-geographic.json').read_text(encoding='utf-8'))
        import math
        for p in geo['buildings']+geo['green']:
            x,z=p['centroid'];lon=geo['origin_lon_lat'][0]+x*6/(111320*math.cos(math.radians(geo['origin_lon_lat'][1])));lat=geo['origin_lon_lat'][1]-z*6/111320
            kind='Mapped green space' if 'height_m' not in p else ('Mapped construction' if p['tags'].get('building')=='construction' else 'Mapped campus building')
            name=p['name'] if not p['name'].startswith('Campus building') or 'height_m' in p else ('Mapped green space' if p['id']=='garden' else p['name'].replace('Campus building','Open area'))
            note='Public OSM footprint. '+(p.get('height_basis','Mapped open-space polygon'))+'. Façade, windows and any missing heights are illustrative. Not an authorised campus survey.'
            Zone.objects.update_or_create(id=p['id'],defaults={'name':name,'kind':kind,'description':f"{name}. {note}",'latitude':lat,'longitude':lon,'geometry_source':p['source_url'],'geometry_note':note})
        templates=[('Plastic-free, one day at a time','Waste','Swap a single-use habit for something that lasts.','Share a photo of your reusable alternative and explain the single-use item it replaces.',15),('Switch off. Make a difference.','Energy','Make saving energy part of your everyday routine.','Photograph an authorised energy-saving action. Do not touch electrical panels or disrupt equipment.',15),('A little care for our green spaces','Green spaces','Give a shared green corner a little attention.','Document a permitted clean-up or care activity and describe what you did. Avoid disturbing wildlife.',25)]
        for title,cat,desc,instructions,points in templates:
            Challenge.objects.get_or_create(title=title,defaults={'category':cat,'description':desc,'instructions':instructions,'points':points,'starts':date.today(),'ends':date.today()+timedelta(days=30)})
        if opts['demo']:
            if not settings.DEBUG:raise CommandError('Demo accounts are restricted to local DEBUG mode.')
            local_dir=settings.BASE_DIR.parent/'.local';local_dir.mkdir(exist_ok=True)
            password_file=local_dir/'demo-password.txt'
            password=os.environ.get('ECOTWIN_DEMO_PASSWORD') or (password_file.read_text().strip() if password_file.exists() else secrets.token_urlsafe(24))
            password_file.write_text(password)
            for username,name,staff in [('student','Campus Explorer',False),('moderator','Campus Moderator',True)]:
                u,created=get_user_model().objects.get_or_create(username=username,defaults={'first_name':name,'email':f'{username}@example.test','is_staff':staff})
                if created:u.set_password(password);u.save()
        self.stdout.write(self.style.SUCCESS('Campus and challenge templates seeded. No environmental measurements were invented.'))
