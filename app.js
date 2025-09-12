const scene = document.querySelector('a-scene');
const cam = document.querySelector('#camera');
const btnVR = document.querySelector('#btnVR');
const btnAR = document.querySelector('#btnAR');
const btnCube = document.querySelector('#spawnCube');
const btnSphere = document.querySelector('#spawnSphere');
const reticle = document.querySelector('#reticle');

// Enter VR / MR buttons
btnVR.addEventListener('click', async () => {
  try { await scene.enterVR(); } catch (e) { console.warn(e); }
});
btnAR.addEventListener('click', async () => {
  try { await scene.enterAR(); } catch (e) { console.warn(e); }
});

// Helper: spawn position ~1m in front of camera (fallback)
function frontOfCamera(offset = 1) {
  const p = new THREE.Vector3(0, -0.1, -offset);
  cam.object3D.localToWorld(p);
  return p;
}

// Random color helper
function randColor() {
  const palette = ['#2ec4b6', '#ff9f1c', '#e71d36', '#ffd166', '#06d6a0', '#118ab2', '#8338ec'];
  return palette[Math.floor(Math.random() * palette.length)];
}

// Spawn dynamic box or sphere with physics + grabbable
function spawn(type = 'box') {
  const el = document.createElement('a-entity');
  if (type === 'box') {
    el.setAttribute('geometry', 'primitive: box; depth: 0.3; height: 0.3; width: 0.3');
  } else {
    el.setAttribute('geometry', 'primitive: sphere; radius: 0.18');
  }
  el.setAttribute('material', `color: ${randColor()}`);
  el.setAttribute('class', 'grabbable');
  el.setAttribute('dynamic-body', 'shape: auto; mass: 1');

  const pos = reticle.getAttribute('visible') ? reticle.object3D.position : frontOfCamera(1.0);
  el.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);

  el.setAttribute('grabbable', '');
  el.setAttribute('hoverable', '');
  el.setAttribute('stretchable', '');
  el.setAttribute('draggable', '');

  scene.appendChild(el);
}

btnCube.addEventListener('click', () => spawn('box'));
btnSphere.addEventListener('click', () => spawn('sphere'));

// AR hit-test component to drive reticle placement
AFRAME.registerComponent('ar-hit-test', {
  init: function () {
    this.hitTestSource = null;
    this.viewerSpace = null;
    this.refSpace = null;

    this.el.addEventListener('enter-vr', () => {
      if (this.el.is('ar-mode')) {
        this.setupHitTest();
      }
    });
    this.el.addEventListener('exit-vr', () => {
      this.hitTestSource = null;
      this.viewerSpace = null;
    });
  },
  setupHitTest: function () {
    const session = this.el.renderer.xr.getSession();
    if (!session) return;
    session.requestReferenceSpace('viewer').then((space) => {
      this.viewerSpace = space;
      session.requestHitTestSource({ space: this.viewerSpace }).then((source) => {
        this.hitTestSource = source;
      });
    });
    session.requestReferenceSpace('local').then((space) => {
      this.refSpace = space;
    });
    session.addEventListener('end', () => {
      this.hitTestSource = null;
      this.viewerSpace = null;
    });
  },
  tick: function () {
    if (!this.hitTestSource) return;
    const frame = this.el.frame;
    if (!frame) return;
    const hits = frame.getHitTestResults(this.hitTestSource);
    if (hits.length > 0) {
      const hit = hits[0];
      const pose = hit.getPose(this.refSpace);
      reticle.object3D.position.set(
        pose.transform.position.x,
        pose.transform.position.y,
        pose.transform.position.z
      );
      reticle.object3D.quaternion.set(
        pose.transform.orientation.x,
        pose.transform.orientation.y,
        pose.transform.orientation.z,
        pose.transform.orientation.w
      );
      reticle.setAttribute('visible', true);
    } else {
      reticle.setAttribute('visible', false);
    }
  }
});

scene.setAttribute('ar-hit-test', '');
