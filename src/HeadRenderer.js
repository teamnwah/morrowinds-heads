import * as THREE from 'three'
import {Color, Group} from 'three'
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

export class HeadRenderer {
  constructor() {
    this.shapes = {};
    this.scene = null;
    this.renderer = null;
    this.camera = null;
  }

  init() {
    const W = window.innerWidth, H = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(W, H);
    document.body.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(70, W / H, 1, 200);
    this.camera.position.z = 60;

    this.scene = new THREE.Scene();
    this.scene.background = new Color(0xffffff);

    let light = new THREE.PointLight(0xffffff, 1);
    light.position.set(1, 1, 2);

    // Make sure light follow the camera
    this.camera.add(light);

    // Add camera to scene so light gets rendered
    this.scene.add(this.camera);

    let ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);

    new OrbitControls(this.camera, this.renderer.domElement);

    if (typeof __THREE_DEVTOOLS__ !== 'undefined') {
      __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('observe', {detail: this.scene}));
      __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('observe', {detail: this.renderer}));
    }
  }

  draw() {
    window.requestAnimationFrame(() => this.draw());
    this.renderer.render(this.scene, this.camera);
  }

  add(shapeCollection) {
    this.shapes[shapeCollection.id] = shapeCollection;
    this.scene.add(shapeCollection.getGroup());
  }

  remove(shapeCollection) {
    delete this.shapes[shapeCollection.id];
    this.scene.remove(shapeCollection.getGroup());
  }

  expose() {
    window.scene = this.scene;
    window.camera = this.camera;
    window.renderer = this.renderer;
  }
}