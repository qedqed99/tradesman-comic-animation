# Render clay frames for scenes of timeline.js.
#   /opt/clay/bin/python clay/blender/render.py --scene checklist [--times 1,4.5] [--res 1280x720] [--samples 48] [--fps 12]
# Frames go to clay/frames/<scene>/NNNN.jpg plus anchors.json (mouth positions on the 1920x1080 stage, for bubble tails).
# --times renders only those seconds as quick stills into clay/stills/.
import sys, os, json, argparse, subprocess, time, math
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import bpy
from bpy_extras.object_utils import world_to_camera_view

ap = argparse.ArgumentParser()
ap.add_argument('--scene', action='append', required=True)
ap.add_argument('--times', default=None)
ap.add_argument('--res', default='1280x720')
ap.add_argument('--samples', type=int, default=48)
ap.add_argument('--fps', type=int, default=12)
ap.add_argument('--from', dest='frm', type=int, default=0)
A = ap.parse_args()

def timeline():
    # timeline.js with the clay-only changes from clay/overrides.js applied
    js = "global.window={};require(process.argv[1]);require(process.argv[2]);process.stdout.write(JSON.stringify(window.CLAY.apply(window.TIMELINE)))"
    return json.loads(subprocess.check_output(['node', '-e', js, os.path.join(ROOT, 'timeline.js'), os.path.join(ROOT, 'clay', 'overrides.js')], cwd='/tmp'))

TL = timeline()
W, H = map(int, A.res.split('x'))

for sid in A.scene:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    import importlib, lib, sets, shots
    for m in (lib, sets, shots): importlib.reload(m)
    cfg = next(s for s in TL['scenes'] if s['id'] == sid)
    vpath = os.path.join(ROOT, 'clay', 'voices', sid + '.json')
    voices = json.load(open(vpath)) if os.path.exists(vpath) else {}
    ctx = shots.Ctx(cfg, voices, A.fps)
    sh = shots.SHOTS[sid]()
    anchors = sh.build(ctx)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.cycles.samples = A.samples; sc.cycles.use_adaptive_sampling = True; sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 1; sc.cycles.transmission_bounces = 0
    sc.render.resolution_x, sc.render.resolution_y = W, H; sc.render.resolution_percentage = 100
    sc.render.use_persistent_data = True
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 90
    if A.times:
        outdir = os.path.join(ROOT, 'clay', 'stills'); os.makedirs(outdir, exist_ok=True)
        times = [float(x) for x in A.times.split(',')]
    else:
        outdir = os.path.join(ROOT, 'clay', 'frames', sid); os.makedirs(outdir, exist_ok=True)
        times = [f / A.fps for f in range(round(cfg['duration'] * A.fps))]
    marks = []
    t0 = time.time()
    for i, t in enumerate(times):
        frame = round(t * A.fps)
        sh.render(t, frame)
        bpy.context.view_layer.update()
        a = {}
        for who, ob in anchors.items():
            p = world_to_camera_view(sc, sc.camera, ob.matrix_world.translation)
            a[who] = [round(p.x * 1920, 1), round((1 - p.y) * 1080, 1)]
        marks.append(a)
        if A.times:
            sc.render.filepath = os.path.join(outdir, f'{sid}_{t:05.2f}.jpg')
        else:
            if i < A.frm: continue
            sc.render.filepath = os.path.join(outdir, f'{i:04d}.jpg')
        bpy.ops.render.render(write_still=True)
        print(f'{sid} {i + 1}/{len(times)} t={t:.2f} {time.time() - t0:.0f}s', flush=True)
    if not A.times:
        json.dump({'fps': A.fps, 'frames': marks}, open(os.path.join(outdir, 'anchors.json'), 'w'))
