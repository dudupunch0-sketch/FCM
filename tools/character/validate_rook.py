"""Validate the delivered GLB bytes, including a skinning round-trip at rest."""
from pathlib import Path
import json
import struct
import numpy as np

path = Path(__file__).resolve().parents[2] / 'assets/characters/rook/rook.glb'
raw = path.read_bytes()
magic, version, total = struct.unpack_from('<4sII', raw)
assert magic == b'glTF' and version == 2 and total == len(raw)
length, kind = struct.unpack_from('<I4s', raw, 12)
assert kind == b'JSON'
g = json.loads(raw[20:20+length])
blen, kind = struct.unpack_from('<I4s', raw, 20+length)
assert kind == b'BIN\0'
b = raw[28+length:]
assert len(b) == blen and g['buffers'][0]['byteLength'] <= blen


def read(index):
    a = g['accessors'][index]; v = g['bufferViews'][a['bufferView']]
    components = dict(SCALAR=1, VEC3=3, VEC4=4, MAT4=16)[a['type']]
    dtype = {5126:'<f4', 5123:'<u2', 5125:'<u4'}[a['componentType']]
    assert v['byteOffset'] % 4 == 0
    out = np.frombuffer(b, dtype=dtype, count=a['count']*components,
                        offset=v['byteOffset']+a.get('byteOffset', 0)).reshape(-1, components)
    assert out.nbytes <= v['byteLength']
    assert np.isfinite(out).all()
    return out


skin = g['skins'][0]
inverse = read(skin['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1)
nodes = g['nodes']; world = {}


def walk(idx, parent):
    assert idx not in world, 'cycle or multiply parented node'
    m = np.eye(4); m[:3,3] = nodes[idx].get('translation', [0,0,0])
    world[idx] = parent @ m
    for child in nodes[idx].get('children', []):
        walk(child, world[idx])


for root in g['scenes'][0]['nodes']:
    walk(root, np.eye(4))
matrices = np.array([world[idx] @ inverse[i] for i,idx in enumerate(skin['joints'])])
assert np.allclose(matrices, np.eye(4), atol=1e-6)
count = 0
for p in g['meshes'][0]['primitives']:
    a = p['attributes']; pos = read(a['POSITION']); norm = read(a['NORMAL'])
    joints = read(a['JOINTS_0']); weights = read(a['WEIGHTS_0'])
    indices = read(p['indices']).ravel()
    assert len(pos) == len(joints) == len(weights) == len(norm)
    assert indices.max() < len(pos) and len(indices) % 3 == 0
    assert joints.max() < len(skin['joints'])
    assert (weights >= 0).all() and np.allclose(weights.sum(axis=1), 1)
    assert np.allclose(np.linalg.norm(norm,axis=1),1,atol=1e-4)
    hp = np.column_stack([pos, np.ones(len(pos))])
    result = sum((np.einsum('nij,nj->ni',matrices[joints[:,k]],hp)*weights[:,k,None]) for k in range(4))
    assert np.allclose(result[:,:3],pos,atol=1e-6)
    count += len(pos)
anim = g['animations'][0]; sampler = anim['samplers'][0]
time = read(sampler['input']).ravel(); q = read(sampler['output'])
assert np.all(np.diff(time)>0) and len(time)==len(q)
assert np.allclose(np.linalg.norm(q,axis=1),1)
joint = anim['channels'][0]['target']['node']
assert nodes[joint]['name']=='forearm_L'
assert not np.allclose(q[0],q[2]) and np.allclose(q[0],q[-1])
print(f'GLB structural and bind-pose validation passed: {count} vertices, {len(skin["joints"])} joints')

# Exercise the exported skin at the middle keyframe, including descendant hand motion.
import importlib.util
spec=importlib.util.spec_from_file_location('rook_renderer',Path(__file__).with_name('build_rook.py'))
renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
posed={}
x,y,z,w=q[2]
rotation=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
                   [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
                   [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])


def pose(idx,parent):
    m=np.eye(4);m[:3,3]=nodes[idx].get('translation',[0,0,0])
    if idx==joint:m[:3,:3]=rotation
    posed[idx]=parent@m
    for child in nodes[idx].get('children',[]):pose(child,posed[idx])


for root in g['scenes'][0]['nodes']:pose(root,np.eye(4))
pm=np.array([posed[idx]@inverse[i] for i,idx in enumerate(skin['joints'])])
renderer.PARTS=[]
max_motion=0
for p in g['meshes'][0]['primitives']:
    a=p['attributes'];pos=read(a['POSITION']);normal=read(a['NORMAL'])
    js=read(a['JOINTS_0']);ws=read(a['WEIGHTS_0'])
    hp=np.column_stack([pos,np.ones(len(pos))])
    moved=sum(np.einsum('nij,nj->ni',pm[js[:,k]],hp)*ws[:,k,None] for k in range(4))[:,:3]
    normals=sum(np.einsum('nij,nj->ni',pm[js[:,k],:3,:3],normal)*ws[:,k,None] for k in range(4))
    assert np.isfinite(moved).all()
    max_motion=max(max_motion,float(np.linalg.norm(moved-pos,axis=1).max()))
    renderer.PARTS.append(dict(v=moved,n=normals,f=read(p['indices']).reshape(-1,3),mat=g['materials'][p['material']]['name']))
assert .1<max_motion<.5, 'rig check did not create plausible forearm movement'
renderer.render(20,(480,780),(0,.94,0),370).save(path.with_name('rig-check-preview.png'))
print('Exported animation/skin deformation rendered successfully')
