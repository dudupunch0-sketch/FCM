"""Rebuild the original Rook blockout, skinned GLB, and geometry review renders.

Requires Python, NumPy and Pillow. No downloaded game meshes/textures are used.
Coordinates: metres, +Y up, +Z face forward. Reference art lives in docs/art.
"""
from pathlib import Path
import json
import math
import struct
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/characters/rook'
P = json.loads((OUT / 'profile.json').read_text())
PARTS, BONES = [], []


def bone(name, parent, xyz):
    BONES.append(dict(name=name, parent=parent, position=np.array(xyz, float)))
    return len(BONES)-1


hips = bone('hips', None, [0, .94, 0])
spine = bone('spine', hips, [0, 1.13, 0])
chest = bone('chest', spine, [0, 1.37, 0])
neck = bone('neck', chest, [0, 1.51, 0])
head = bone('head', neck, [0, 1.61, 0])
LIMBS = []
for side, s in [('L', 1), ('R', -1)]:
    shoulder = bone('clavicle_'+side, chest, [s*.15, 1.43, 0])
    upper = bone('upper_arm_'+side, shoulder, [s*.235, 1.405, 0])
    lower = bone('forearm_'+side, upper, [s*.405, 1.165, .01])
    hand = bone('hand_'+side, lower, [s*.515, .94, .03])
    thigh = bone('thigh_'+side, hips, [s*.104, .905, 0])
    shin = bone('shin_'+side, thigh, [s*.125, .515, .016])
    foot = bone('foot_'+side, shin, [s*.14, .105, .008])
    LIMBS.append((s, upper, lower, hand, thigh, shin, foot))


def add(name, vertices, faces, material, joint, weights=None):
    v = np.asarray(vertices, np.float32)
    f = np.asarray(faces, np.uint32)
    normals = np.zeros_like(v)
    fn = np.cross(v[f[:, 1]]-v[f[:, 0]], v[f[:, 2]]-v[f[:, 0]])
    for k in range(3):
        np.add.at(normals, f[:, k], fn)
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-9)
    j = np.zeros((len(v), 4), np.uint16)
    w = np.zeros((len(v), 4), np.float32)
    j[:, 0] = joint
    w[:, 0] = 1
    if weights:
        for i, pt in enumerate(v):
            pairs = weights(pt)
            for k, (idx, weight) in enumerate(pairs):
                j[i, k], w[i, k] = idx, weight
    PARTS.append(dict(name=name, v=v, f=f, n=normals, mat=material, j=j, w=w))


def rings(name, sections, material, joint, segments=32, deform=None, weights=None):
    # sections are center x,y,z and elliptical radii x,z, ordered bottom to top.
    vertices, faces = [], []
    for cx, y, cz, rx, rz in sections:
        for i in range(segments):
            a = 2*math.pi*i/segments
            pt = np.array([cx+rx*math.sin(a), y, cz+rz*math.cos(a)])
            vertices.append(deform(pt, a) if deform else pt)
    for r in range(len(sections)-1):
        for i in range(segments):
            a, b = r*segments+i, r*segments+(i+1)%segments
            faces.extend([(a, b, a+segments), (b, b+segments, a+segments)])
    vertices.extend([sections[0][:3], sections[-1][:3]])
    for i in range(segments):
        faces.extend([(len(vertices)-2, (i+1)%segments, i),
                      (len(vertices)-1, (len(sections)-1)*segments+i,
                       (len(sections)-1)*segments+(i+1)%segments)])
    add(name, vertices, faces, material, joint, weights)


def tube(name, centers, widths, depths, material, joint, weights=None, segments=16):
    c = np.asarray(centers, float)
    vertices, faces = [], []
    for k, p in enumerate(c):
        axis = c[min(k+1, len(c)-1)]-c[max(k-1, 0)]
        axis /= np.linalg.norm(axis)
        ref = np.array([0, 0, 1.])
        if abs(axis@ref) > .94:
            ref = np.array([1., 0, 0])
        right = np.cross(axis, ref); right /= np.linalg.norm(right)
        front = np.cross(right, axis)
        for i in range(segments):
            a = 2*math.pi*i/segments
            vertices.append(p+right*widths[k]*math.cos(a)+front*depths[k]*math.sin(a))
    for k in range(len(c)-1):
        for i in range(segments):
            a, b = k*segments+i, k*segments+(i+1)%segments
            faces.extend([(a, a+segments, b), (b, a+segments, b+segments)])
    vertices.extend([c[0], c[-1]])
    for i in range(segments):
        faces.extend([(len(vertices)-2, i, (i+1)%segments),
                      (len(vertices)-1, (len(c)-1)*segments+(i+1)%segments,
                       (len(c)-1)*segments+i)])
    add(name, vertices, faces, material, joint, weights)


def ellipsoid(name, center, radius, material, joint, seg=24, lat=12):
    sections = []
    for k in range(lat+1):
        a = -math.pi/2 + math.pi*k/lat
        sections.append([center[0], center[1]+radius[1]*math.sin(a), center[2],
                         max(.0001, radius[0]*math.cos(a)), max(.0001, radius[2]*math.cos(a))])
    rings(name, sections, material, joint, seg)


def torso_weights(pt):
    y = pt[1]
    if y < 1.14:
        t = np.clip((y-1.00)/.14, 0, 1); return [(hips, 1-t), (spine, t)]
    t = np.clip((y-1.20)/.16, 0, 1); return [(spine, 1-t), (chest, t)]


# Body is a continuous surface; no separate abdominal or pectoral spheres.
body = [[0,.90,0,.137,.092],[0,.98,0,.145,.092],[0,1.07,0,.131,.079],
        [0,1.16,0,.145,.084],[0,1.27,0,.177,.104],[0,1.36,0,.205,.108],
        [0,1.42,-.006,.205,.094],[0,1.46,0,.154,.075],[0,1.50,0,.065,.054]]
rings('torso', body, 'skin', hips, weights=torso_weights)
rings('neck', [[0,1.46,0,.066,.059],[0,1.54,0,.052,.050],[0,1.60,0,.053,.054]], 'skin', neck)

# Chin to crown, with a continuous nose and restrained orbital recesses.
scale = P['face']['width_scale']
face_sections = [[0,1.565,.024,.025,.032],[0,1.584,.017,.046,.050],
 [0,1.607,.006,.064,.067],[0,1.638,0,.083,.079],[0,1.666,-.002,.095,.087],
 [0,1.696,-.002,.096,.088],[0,1.727,-.005,.095,.090],
 [0,1.760,-.008,.089,.084],[0,1.788,-.012,.070,.066],[0,1.804,-.014,.032,.037]]
face_sections = [[x,y,z,rx*scale,rz] for x,y,z,rx,rz in face_sections]


def facial(pt, angle):
    x,y,z = pt
    if math.cos(angle)>0:
        nose = P['face']['nose_projection']*math.exp(-((x/.017)**2+((y-1.658)/.027)**2))
        bridge = .009*math.exp(-((x/.015)**2+((y-1.691)/.038)**2))
        orbit = .007*math.exp(-(((abs(x)-.043)/.026)**2+((y-1.699)/.017)**2))
        pt[2] += nose+bridge-orbit
    return pt


rings('face', face_sections, 'skin', head, 64, facial)
for s in [-1, 1]:
    ellipsoid('ear', [s*.095,1.676,-.004], [.016,.032,.018], 'skin', head)
    ellipsoid('ear_inner', [s*.103,1.676,.008], [.007,.020,.010], 'skin_shadow', head)
    # Almond-shaped eye surface on the face, +Z. Raised outer corner.
    cx = s*P['face']['eye_spacing']; cy=1.700
    vertices = [[cx,cy,.080]]
    n=32
    for i in range(n):
        a=2*math.pi*i/n
        dx=.027*math.cos(a); dy=.012*math.sin(a)
        vertices.append([cx+dx,cy+dy+s*dx*.10,.074-abs(dx)*.08])
    add('eye_white', vertices, [(0,i+1,(i+1)%n+1) for i in range(n)], 'ivory', head)
    ellipsoid('iris', [cx-s*.002,cy,.081], [.010,.011,.003], 'iris', head)
    ellipsoid('pupil', [cx-s*.002,cy,.084], [.0045,.008,.0015], 'ink', head)
    ellipsoid('eye_glint', [cx-.003,cy+.004,.086], [.0025,.0025,.001], 'ivory', head, 12, 8)
    top=[]
    for t in np.linspace(0,math.pi,12):
        dx=.027*math.cos(t)
        top.append([cx+dx,cy+.012*math.sin(t)+s*dx*.10,.075-abs(dx)*.08])
    tube('upper_lid',top,[.0022]*12,[.0018]*12,'ink',head,segments=8)
    tube('brow',[[cx-s*.025,1.726,.082],[cx,1.732,.084],[cx+s*.029,1.729,.077]],
         [.002,.005,.001],[.002,.003,.001],'hair_shadow',head,segments=8)
tube('mouth', [[-.023,1.619,.079],[0,1.617,.085],[.023,1.619,.079]],
     [.0015,.002,.0008],[.0015,.002,.001],'lip',head,segments=8)

# Hair shell is open at the hairline. Individual tapered locks define the silhouette.
hair_sections=[[0,1.708,-.025,.098,.078],[0,1.750,-.017,.104,.094],
               [0,1.792,-.019,.087,.080],[0,1.820,-.020,.045,.042],[0,1.824,-.020,.001,.001]]
# Front is lifted, leaving the eyes visible.
def hairline(pt,a):
    if pt[1]<1.71: pt[1]+=.036*max(math.cos(a),0)
    return pt
rings('hair_cap',hair_sections,'hair',head,48,hairline)
locks=[([[-.03,1.817,.016],[-.070,1.782,.067],[-.089,1.731,.069],[-.071,1.678,.071]],[.026,.030,.019,.001]),
       ([[.005,1.818,.030],[.045,1.794,.075],[.080,1.761,.081],[.093,1.735,.057]],[.030,.033,.022,.001]),
       ([[.003,1.807,.080],[-.026,1.782,.098],[-.044,1.751,.097],[-.052,1.713,.086]],[.025,.025,.018,.001]),
       ([[.040,1.799,.070],[.062,1.770,.096],[.076,1.743,.085]],[.021,.019,.001])]
for k,(centers,widths) in enumerate(locks):
    tube('fringe_'+str(k),centers,widths,[x*.42 for x in widths], 'hair' if k%2 else 'hair_light',head)
for s in [-1,1]:
    tube('side_lock',[[s*.089,1.748,.01],[s*.105,1.693,.005],[s*.100,1.634,.025],[s*.077,1.596,.045]],
         [.024,.023,.016,.001],[.020,.019,.014,.001],'hair',head)
    tube('nape_lock',[[s*.060,1.749,-.084],[s*.075,1.695,-.099],[s*.045,1.640,-.090]],
         [.025,.027,.001],[.020,.019,.001],'hair_shadow',head)

# Blue training shorts and handwraps are an original provisional sports kit.
rings('waistband',[[0,.956,0,.149,.098],[0,.995,0,.145,.096]],'wrap',hips)
for s,upper,lower,hand,thigh,shin,foot in LIMBS:
    ellipsoid('deltoid',[s*.211,1.410,0],[.075,.070,.072],'skin',upper)
    a,b,c=[BONES[i]['position'] for i in [upper,lower,hand]]
    centers=[a,a*.7+b*.3,a*.25+b*.75,b,b*.65+c*.35,b*.15+c*.85,c]
    def arm_weights(pt,a=a,b=b,upper=upper,lower=lower):
        axis=b-a; t=np.clip(((pt-b)@axis)/(axis@axis)*5+.5,0,1)
        return [(upper,1-t),(lower,t)]
    tube('arm',centers,[.075,.071,.051,.046,.050,.033,.030],
         [.071,.068,.050,.043,.047,.032,.030],'skin',upper,arm_weights,24)
    ellipsoid('fist',c+np.array([s*.022,-.041,.012]),[.043,.060,.042],'wrap',hand)
    ellipsoid('thumb',c+np.array([-s*.012,-.033,.043]),[.023,.034,.023],'skin',hand)
    tube('wrist_wrap',[b*.08+c*.92,c+np.array([s*.010,-.021,0])],[.038,.038],[.036,.036],'wrap',hand)
    a,b,c=[BONES[i]['position'] for i in [thigh,shin,foot]]
    def leg_weights(pt,thigh=thigh,shin=shin):
        t=np.clip((.57-pt[1])/.11,0,1); return [(thigh,1-t),(shin,t)]
    centers=[a,a*.6+b*.4,a*.15+b*.85,b,b*.68+c*.32,b*.2+c*.8,c]
    tube('leg',centers,[.091,.088,.064,.059,.064,.038,.034],
         [.093,.092,.066,.060,.072,.040,.035],'skin',thigh,leg_weights,24)
    tube('shorts',[[s*.10,.955,0],[s*.115,.84,0],[s*.12,.738,0]],
         [.116,.114,.101],[.107,.119,.105],'kit',thigh)
    tube('shorts_hem',[[s*.12,.749,0],[s*.12,.727,0]], [.103,.104],[.107,.108],'trim',thigh)
    ellipsoid('boot',[s*.14,.080,.051],[.066,.075,.136],'boot',foot)
    tube('boot_collar',[[s*.14,.090,.005],[s*.14,.21,.009]],[.054,.047],[.052,.047],'boot',foot)
    ellipsoid('sole',[s*.14,.024,.060],[.069,.018,.135],'trim',foot)


def export_glb():
    blob=bytearray(); views=[]; accessors=[]
    def acc(a,typ,component=5126):
        while len(blob)%4: blob.append(0)
        a=np.asarray(a,dtype={5126:'<f4',5123:'<u2',5125:'<u4'}[component])
        offset=len(blob); blob.extend(a.tobytes())
        views.append(dict(buffer=0,byteOffset=offset,byteLength=a.nbytes))
        item=dict(bufferView=len(views)-1,componentType=component,count=len(a),type=typ)
        if typ=='VEC3': item.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
        accessors.append(item); return len(accessors)-1
    materials=[]; matids={}
    for name,color in P['palette'].items():
        matids[name]=len(materials)
        # Profile uses display sRGB; glTF baseColorFactor uses linear RGB.
        srgb=np.array([int(color[k:k+2],16)/255 for k in (1,3,5)])
        linear=np.where(srgb<=.04045,srgb/12.92,((srgb+.055)/1.055)**2.4)
        materials.append(dict(name=name,pbrMetallicRoughness=dict(baseColorFactor=[*linear.tolist(),1],metallicFactor=0,roughnessFactor=.85)))
    primitives=[]
    for part in PARTS:
        primitives.append(dict(attributes=dict(POSITION=acc(part['v'],'VEC3'),NORMAL=acc(part['n'],'VEC3'),
          JOINTS_0=acc(part['j'],'VEC4',5123),WEIGHTS_0=acc(part['w'],'VEC4')),
          indices=acc(part['f'].flatten(),'SCALAR',5125),material=matids[part['mat']],extras=dict(part=part['name'])))
    nodes=[]
    for b in BONES:
        offset=b['position']-(BONES[b['parent']]['position'] if b['parent'] is not None else 0)
        nodes.append(dict(name=b['name'],translation=offset.tolist()))
    for i,b in enumerate(BONES):
        if b['parent'] is not None: nodes[b['parent']].setdefault('children',[]).append(i)
    matrices=[]
    for b in BONES:
        m=np.eye(4);m[:3,3]=-b['position'];matrices.append(m.T.flatten())
    skin=dict(name='RookRig',joints=list(range(len(BONES))),skeleton=hips,inverseBindMatrices=acc(matrices,'MAT4'))
    nodes.append(dict(name='RookMesh',mesh=0,skin=0))
    # Minimal deformation check, not a combat animation or a retargeted Link clip.
    times=acc(np.array([0,.5,1,1.5,2]),'SCALAR')
    angles=np.array([0,-.45,-.90,-.45,0])
    quat=np.stack([angles*0,np.sin(angles/2),angles*0,np.cos(angles/2)],axis=1)
    animation=dict(name='rig_check',samplers=[dict(input=times,output=acc(quat,'VEC4'),interpolation='LINEAR')],
                   channels=[dict(sampler=0,target=dict(node=LIMBS[0][2],path='rotation'))])
    gltf=dict(asset=dict(version='2.0',generator='FCM Rook source builder'),scene=0,
       scenes=[dict(nodes=[hips,len(nodes)-1])],nodes=nodes,meshes=[dict(name='Rook',primitives=primitives)],
       skins=[skin],animations=[animation],materials=materials,buffers=[dict(byteLength=len(blob))],
       bufferViews=views,accessors=accessors,extras=dict(stage='art blockout',profile='profile.json',forward='+Z',up='+Y',units='metres'))
    raw=json.dumps(gltf,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4)
    blob+=b'\0'*((-len(blob))%4)
    out=struct.pack('<4sII',b'glTF',2,28+len(raw)+len(blob))
    out+=struct.pack('<I4s',len(raw),b'JSON')+raw+struct.pack('<I4s',len(blob),b'BIN\0')+blob
    (OUT/'rook.glb').write_bytes(out)
    return gltf


def render(yaw, size, target, scale):
    """Orthographic z-buffer rasterization of the SAME vertices exported to GLB."""
    width,height=size
    pixels=np.empty((height,width,3),np.uint8);pixels[:]=[231,234,236]
    depth=np.full((height,width),-np.inf)
    a=math.radians(yaw);right=np.array([math.cos(a),0,-math.sin(a)])
    forward=np.array([math.sin(a),0,math.cos(a)])
    view=np.stack([right,[0,1,0],forward])
    light=np.array([-.45,.65,.62]);light/=np.linalg.norm(light)
    for part in PARTS:
        world=part['v']; pts=(world-np.array(target))@view.T
        xy=np.stack([pts[:,0]*scale+width/2,-pts[:,1]*scale+height/2],axis=1)
        rgb=np.array([int(P['palette'][part['mat']][k:k+2],16) for k in (1,3,5)])
        for ids in part['f']:
            tri=xy[ids]; z=pts[ids,2]
            lo=np.maximum(np.floor(tri.min(axis=0)).astype(int),0)
            hi=np.minimum(np.ceil(tri.max(axis=0)).astype(int),[width-1,height-1])
            if np.any(hi<lo):continue
            x,y=np.meshgrid(np.arange(lo[0],hi[0]+1)+.5,np.arange(lo[1],hi[1]+1)+.5)
            A,B,C=tri;den=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1])
            if abs(den)<1e-9:continue
            w0=((B[1]-C[1])*(x-C[0])+(C[0]-B[0])*(y-C[1]))/den
            w1=((C[1]-A[1])*(x-C[0])+(A[0]-C[0])*(y-C[1]))/den;w2=1-w0-w1
            zz=w0*z[0]+w1*z[1]+w2*z[2]
            sl=(slice(lo[1],hi[1]+1),slice(lo[0],hi[0]+1))
            mask=(w0>=0)&(w1>=0)&(w2>=0)&(zz>depth[sl])
            n=w0[...,None]*part['n'][ids[0]]+w1[...,None]*part['n'][ids[1]]+w2[...,None]*part['n'][ids[2]]
            n/=np.maximum(np.linalg.norm(n,axis=-1,keepdims=True),1e-9)
            shade=np.where(n@light>.45,1.0,np.where(n@light>-.05,.82,.60))
            col=np.clip(rgb*shade[...,None],0,255).astype(np.uint8)
            pixels[sl][mask]=col[mask];depth[sl][mask]=zz[mask]
    return Image.fromarray(pixels)


def main():
    gltf=export_glb()
    board=Image.new('RGB',(1400,850),'#e7eaec');d=ImageDraw.Draw(board)
    board.paste(render(0,(410,730),(0,.94,0),350),(15,70))
    board.paste(render(35,(480,420),(0,1.68,0),1100),(450,80))
    board.paste(render(90,(400,420),(0,1.68,0),1100),(965,80))
    board.paste(render(160,(440,285),(0,1.42,0),550),(620,530))
    d.text((25,20),'ROOK / ORIGINAL GAME CHARACTER / ART BLOCKOUT',fill='#202c37')
    d.text((25,48),'A-POSE',fill='#526477');d.text((455,48),'FACE / THREE-QUARTER',fill='#526477')
    d.text((980,48),'PROFILE',fill='#526477')
    d.text((25,818),'Geometry render from the exported mesh. Toon lighting study; not a game screenshot.',fill='#526477')
    board.save(OUT/'model-preview.png')
    report=dict(vertices=sum(len(p['v']) for p in PARTS),triangles=sum(len(p['f']) for p in PARTS),
                joints=len(BONES),materials=len(gltf['materials']),glb_bytes=(OUT/'rook.glb').stat().st_size)
    (OUT/'build-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))


if __name__=='__main__':
    main()
