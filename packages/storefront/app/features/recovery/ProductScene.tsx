import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {recoverySettings} from '../../config/recovery';

export default function ProductScene({
  paused = false,
  progress = 0,
  angle = 0,
}: {
  paused?: boolean;
  progress?: number;
  angle?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef({paused, progress, angle});
  state.current = {paused, progress, angle};
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    }
    let redraw = true;
    let disposed = false,
      visible = true,
      frame = 0,
      model: THREE.Group | undefined;
    const cfg = recoverySettings.scene;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, cfg.maxPixelRatio),
    );
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(cfg.fieldOfView, 1, 0.1, 100);
    camera.position.set(...cfg.camera);
    camera.lookAt(0, 0, 0);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    const light = new THREE.DirectionalLight(0xfffaf2, 3);
    light.position.set(-3, 5, 4);
    scene.add(light);
    const fill = new THREE.DirectionalLight(0xdee8ff, 2);
    fill.position.set(4, 1, -2);
    scene.add(fill);
    const pointer = {x: 0, y: 0};
    const resize = () => {
      const {width, height} = element.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      redraw = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    intersection.observe(element);
    const move = (event: PointerEvent) => {
      const r = element.getBoundingClientRect();
      pointer.x = (event.clientX - r.left) / r.width - 0.5;
      pointer.y = (event.clientY - r.top) / r.height - 0.5;
    };
    const leave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', leave);
    const cleanupModel = (root: THREE.Group) =>
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((m) => m.dispose());
        }
      });
    new GLTFLoader().load(
      cfg.model,
      (gltf) => {
        if (disposed) {
          cleanupModel(gltf.scene);
          return;
        }
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const pivot = new THREE.Group();
        pivot.add(model);
        scene.add(pivot);
        model = pivot;
        setReady(true);
      },
      undefined,
      () => {
        if (!disposed) setReady(false);
      },
    );
    const lose = (event: Event) => {
      event.preventDefault();
      setReady(false);
      visible = false;
    };
    renderer.domElement.addEventListener('webglcontextlost', lose);
    let last = '';
    const render = (time: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (!visible || document.hidden || !model) return;
      const {paused: stop, progress: p, angle: a} = state.current;
      const key = `${stop}-${p}-${a}`;
      if (stop && last === key && !redraw) return;
      redraw = false;
      last = key;
      model.rotation.y =
        cfg.rotation.base +
        p * cfg.rotation.scroll +
        a +
        (stop ? 0 : pointer.x * cfg.rotation.pointer);
      model.rotation.z = -0.16 + (stop ? 0 : Math.sin(time * 0.0003) * 0.025);
      model.position.y = stop
        ? 0
        : Math.sin(time * 0.001 * cfg.floatSpeed) * cfg.floatAmplitude;
      model.rotation.x = stop ? 0 : pointer.y * 0.08;
      const head = model.getObjectByName('Contact head');
      if (head) head.position.x = -1.25 - Math.max(0, p - 0.65) * 1.4;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(render);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
      renderer.domElement.removeEventListener('webglcontextlost', lose);
      if (model) cleanupModel(model);
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div className="product-scene" data-scene-ready={ready}>
      <img
        className={ready ? 'scene-poster scene-poster-hidden' : 'scene-poster'}
        src={recoverySettings.scene.poster}
        alt="Pulse One, an original blue percussion-device concept"
        width="1000"
        height="1000"
      />
      <div className="scene-canvas" ref={host} aria-hidden="true" />
    </div>
  );
}
