"""Convert the archived OSM extract into a source-linked campus geometry dataset.
No surveying accuracy is implied. All transformations and height assumptions are explicit.
"""
import json,math,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
raw=ET.parse(ROOT/'RVCE Research/data/osm_campus_area.osm').getroot()
nodes={n.attrib['id']:(float(n.attrib['lon']),float(n.attrib['lat'])) for n in raw.findall('node')}
reference=json.loads((ROOT/'RVCE Research/data/osm_campus_reference.json').read_text(encoding='utf-8'))['data']['elements']
boundary=next(e for e in reference if e['type']=='way')
poly=[nodes[str(n)] for n in boundary['nodes']]
origin=[(min(p[0] for p in poly)+max(p[0] for p in poly))/2,(min(p[1] for p in poly)+max(p[1] for p in poly))/2]
def convert(p):return [round((p[0]-origin[0])*111320*math.cos(math.radians(origin[1]))/6,4),round(-(p[1]-origin[1])*111320/6,4)]
def inside(x,y):
    yes=False
    for a,b in zip(poly,poly[1:]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:yes=not yes
    return yes
mapping={'133051269':'cse','133052110':'civil','133052270':'ece','133052402':'library','133052927':'ase-ise','133053007':'admin','133053072':'innovation-hub','133053117':'iem','133117327':'eee','133259801':'ete','513025074':'food-court','1313225783':'parking','636268134':'garden','132995521':'ai-mca'}
data={'origin_lon_lat':origin,'metres_per_scene_unit':6,'projection':'Local equirectangular tangent approximation: x=(lon-lon0)*111320*cos(lat0)/6, z=-(lat-lat0)*111320/6. North=-z. Not a cadastral projection.','source':'https://www.openstreetmap.org/way/55685638','attribution':'© OpenStreetMap contributors · ODbL','retrieved_date':'2026-11-04','height_policy':'Explicit OSM height if present; otherwise building:levels × assumed 3.2 m; otherwise assumed 9.6 m. Facades, window placement and roof details are illustrative.','boundary':[convert(p) for p in poly],'buildings':[],'roads':[],'green':[],'trees':[]}
for w in raw.findall('way'):
    tags={t.attrib['k']:t.attrib['v'] for t in w.findall('tag')};pts=[nodes[n.attrib['ref']] for n in w.findall('nd') if n.attrib['ref'] in nodes]
    if len(pts)<2:continue
    centre=[sum(p[i] for p in pts)/len(pts) for i in [0,1]]
    if not inside(*centre):continue
    key=w.attrib['id'];geometry=[convert(p) for p in pts]
    feature={'id':mapping.get(key,f'osm-{key}'),'osm_id':key,'name':tags.get('name','Central Library' if key=='133052402' else f'Campus building {key[-4:]}'),'points':geometry,'centroid':convert(centre),'tags':tags,'source_url':f'https://www.openstreetmap.org/way/{key}'}
    if 'building' in tags:
        height=9.6;basis='assumed 9.6 m'
        try:
            if 'height' in tags:height=float(tags['height'].replace(' m',''));basis='OSM height tag (not field-verified)'
            elif 'building:levels' in tags:height=max(1,float(tags['building:levels']))*3.2;basis='OSM levels × assumed 3.2 m per level'
        except ValueError:pass
        feature.update(height_m=height,height_units=height/6,height_basis=basis)
        data['buildings'].append(feature)
    elif 'highway' in tags:
        try:width=float(tags.get('width','5' if tags['highway']=='service' else '1.5'))
        except ValueError:width=1.5
        feature['width_units']=width/6;data['roads'].append(feature)
    elif tags.get('leisure') in ['garden','park','pitch','outdoor_seating']:
        data['green'].append(feature)
for n in raw.findall('node'):
    tags={t.attrib['k']:t.attrib['v'] for t in n.findall('tag')}
    if tags.get('natural')=='tree' and inside(*nodes[n.attrib['id']]):data['trees'].append(convert(nodes[n.attrib['id']]))
(ROOT/'frontend/src/campus-geographic.json').write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf-8')
print({k:len(data[k]) for k in ['buildings','roads','green','trees']})
