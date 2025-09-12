const scene = document.querySelector('a-scene');
const reticle = document.querySelector('#reticle');

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
