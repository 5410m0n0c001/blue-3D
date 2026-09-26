// Rosa de zafiro en 3D. Un solo canvas WebGL que se mueve entre dos lugares:
//  - portada: la rosa se abre con el scroll (morph "Abierta")
//  - cierre:  la rosa vuelve cerrada junto a la confirmación
// Si no hay WebGL o falla la carga, se quedan las imágenes de respaldo.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gamaBaja = (navigator.hardwareConcurrency || 4) <= 4 && (navigator.deviceMemory || 4) <= 4;
const slots = {
  portada: document.querySelector('[data-rosa-slot="portada"]'),
  cierre: document.querySelector('[data-rosa-slot="cierre"]'),
};
const portada = document.getElementById('portada');

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const suave = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function hayWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

async function iniciar() {
  if (!hayWebGL()) return;

  const renderer = new THREE.WebGLRenderer({ antialias: devicePixelRatio < 2, alpha: true, powerPreference: 'high-performance' });
  let pr = Math.min(devicePixelRatio, gamaBaja ? 1.25 : 2);
  renderer.setPixelRatio(pr);
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const key = new THREE.DirectionalLight(0xffe9d2, 1.7); key.position.set(2.5, 3, 3);
  const rim = new THREE.DirectionalLight(0x5b7cff, 3.2); rim.position.set(-3, 1.5, -2.5);
  const fill = new THREE.DirectionalLight(0x9fb2ff, 0.6); fill.position.set(0, -2, 3);
  scene.add(key, rim, fill);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);

  // ----- modelo
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(new URL('../models/rosa.glb', import.meta.url).href);
  const rosa = new THREE.Group();
  rosa.add(gltf.scene);
  scene.add(rosa);

  const matPetalo = new THREE.MeshPhysicalMaterial({
    vertexColors: true, color: '#6f86d8', roughness: 0.42, metalness: 0,
    clearcoat: 0.85, clearcoatRoughness: 0.22,
    sheen: 1, sheenColor: new THREE.Color('#4d6be0'), sheenRoughness: 0.45,
    side: THREE.DoubleSide,
  });
  const matTallo = new THREE.MeshStandardMaterial({ color: '#1c2b5c', metalness: 0.65, roughness: 0.32, side: THREE.DoubleSide });
  let petalos = null;
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    if (o.morphTargetInfluences) { petalos = o; o.material = matPetalo; }
    else o.material = matTallo;
  });
  if (!petalos) throw new Error('rosa.glb sin morph target');

  // ----- destellos alrededor de la flor
  const N = gamaBaja ? 55 : 110;
  const pos = new Float32Array(N * 3), fase = new Float32Array(N), tam = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = 0.9 + Math.random() * 1.5, th = Math.random() * Math.PI * 2, y = (Math.random() - 0.35) * 2.2;
    pos.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3);
    fase[i] = Math.random() * 6.28; tam[i] = 0.5 + Math.random() * 1.3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));
  geo.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
  const matDestello = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uPR: { value: pr }, uBrillo: { value: 0.3 } },
    vertexShader: /* glsl */`
      attribute float aFase; attribute float aTam;
      uniform float uT; uniform float uPR; uniform float uBrillo;
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float tw = 0.5 + 0.5 * sin(uT * 1.7 + aFase);
        vA = uBrillo * tw * tw;
        gl_PointSize = aTam * uPR * (26.0 / -mv.z) * (0.6 + 0.4 * tw);
      }`,
    fragmentShader: /* glsl */`
      varying float vA;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float nucleo = smoothstep(0.5, 0.0, d);
        float cruz = max(smoothstep(0.06, 0.0, abs(c.x)), smoothstep(0.06, 0.0, abs(c.y))) * smoothstep(0.5, 0.1, d);
        float a = (nucleo * nucleo + cruz * 0.6) * vA;
        gl_FragColor = vec4(vec3(0.86, 0.9, 1.0) * a, a);
      }`,
  });
  const destellos = new THREE.Points(geo, matDestello);
  scene.add(destellos);

  // ----- encuadre: esfera (centro, radio) vista desde una dirección
  const dir = new THREE.Vector3(), objetivo = new THREE.Vector3();
  function encuadrar(cx, cy, radio, dy) {
    const aspecto = camera.aspect;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspecto);
    const dist = radio / Math.sin(Math.min(vfov, hfov) / 2);
    dir.set(0, dy, 1).normalize();
    objetivo.set(cx, cy, 0);
    camera.position.copy(objetivo).addScaledVector(dir, dist);
    camera.lookAt(objetivo);
  }

  // ----- estado
  let modo = 'portada', slotActivo = null;
  let pObjetivo = reducir ? 1 : 0, p = pObjetivo, pForzado = null;
  let inclX = 0, inclY = 0, inclXObj = 0, inclYObj = 0;
  const visibles = new Set();
  const reloj = new THREE.Clock();
  let t = 0;

  function tamCanvas() {
    if (!slotActivo) return;
    const { width, height } = slotActivo.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function moverA(nombre) {
    if (slotActivo === slots[nombre]) return;
    modo = nombre;
    slotActivo = slots[nombre];
    slotActivo.appendChild(renderer.domElement);
    slotActivo.classList.add('rosa-lista');
    tamCanvas();
    dibujar(0);
  }

  function progresoPortada() {
    const r = portada.getBoundingClientRect();
    const recorrido = r.height - innerHeight;
    return recorrido > 0 ? clamp01(-r.top / recorrido) : 1;
  }

  function dibujar(dt) {
    t += dt;
    let apertura, giro;
    if (modo === 'portada') {
      if (pForzado !== null) pObjetivo = pForzado;
      else if (!reducir) pObjetivo = progresoPortada();
      p += (pObjetivo - p) * (1 - Math.exp(-dt * 7));
      if (dt === 0) p = pObjetivo;
      portada.style.setProperty('--p', p.toFixed(4));
      apertura = suave(0.04, 0.72, p);
      const e = suave(0, 0.85, p);
      const holgura = camera.aspect > 0.8 ? 1.22 : 1; // en pantallas anchas manda la altura
      encuadrar(0, lerp(-0.62, 0.12, e), lerp(1.3 * holgura, 1.0, e), lerp(0.22, 1.05, e));
      giro = p * 1.9 + (reducir ? 0 : t * 0.12);
      matDestello.uniforms.uBrillo.value = lerp(0.25, 1, apertura);
    } else {
      apertura = reducir ? 0.05 : 0.06 + 0.05 * Math.sin(t * 1.1);
      encuadrar(0, -0.45, 1.2, 0.3);
      giro = reducir ? 0.6 : t * 0.25;
      matDestello.uniforms.uBrillo.value = 0.55;
    }
    inclX += (inclXObj - inclX) * (1 - Math.exp(-dt * 4));
    inclY += (inclYObj - inclY) * (1 - Math.exp(-dt * 4));
    petalos.morphTargetInfluences[0] = apertura;
    rosa.rotation.set(inclX, giro + inclY, 0);
    destellos.rotation.y = -t * 0.05 + giro * 0.3;
    matDestello.uniforms.uT.value = t;
    renderer.render(scene, camera);
  }

  // calidad adaptativa: si va lento, baja la resolución una vez
  let muestras = 0, acumulado = 0, bajado = false;
  function medir(dt) {
    if (bajado || dt <= 0 || dt > 0.25) return;
    acumulado += dt; muestras++;
    if (muestras === 90) {
      if (acumulado / muestras > 1 / 40) {
        pr = 1; renderer.setPixelRatio(pr); matDestello.uniforms.uPR.value = pr; tamCanvas(); bajado = true;
      }
      muestras = 0; acumulado = 0;
    }
  }

  function bucle() {
    requestAnimationFrame(bucle);
    const dt = Math.min(reloj.getDelta(), 0.1);
    if (!visibles.size || document.hidden || reducir) return;
    dibujar(dt);
    medir(dt);
  }

  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      const nombre = e.target.dataset.rosaSlot;
      if (e.isIntersecting) visibles.add(nombre); else visibles.delete(nombre);
    });
    if (visibles.has('cierre')) moverA('cierre');
    else if (visibles.has('portada')) moverA('portada');
  }, { rootMargin: '10% 0px' });
  Object.values(slots).forEach((s) => io.observe(s));

  addEventListener('resize', () => { tamCanvas(); if (reducir) dibujar(0); });
  if (!reducir) {
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      inclYObj = (e.clientX / innerWidth - 0.5) * 0.5;
      inclXObj = (e.clientY / innerHeight - 0.5) * 0.25;
    }, { passive: true });
  }
  moverA('portada');
  bucle();

  // gancho de depuración / captura de imágenes de respaldo: ?debug
  if (location.search.includes('debug')) {
    window.__rosa = {
      capturar(nombreModo, progreso) {
        modo = nombreModo; pForzado = progreso;
        dibujar(0);
        const png = renderer.domElement.toDataURL('image/png');
        pForzado = null;
        return png;
      },
      renderer,
    };
  }
}

iniciar().catch((err) => console.warn('Rosa 3D no disponible, se usa imagen de respaldo:', err));
