// Rosa de zafiro en 3D que acompaña todo el scroll.
//  - Portada: se abre pétalo por pétalo con el scroll (morph "Abierta").
//  - Después viaja entre secciones según su data-rosa:
//      izq / der  → en escritorio se coloca de ese lado y el contenido ocupa el otro;
//                   en celular queda detrás del texto, tenue.
//      cierre     → se cierra y se posa en el hueco sobre la confirmación.
//      final      → pequeña y entreabierta en la despedida.
// Un solo canvas fijo detrás del contenido. Sin WebGL quedan las imágenes de respaldo.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gamaBaja = (navigator.hardwareConcurrency || 4) <= 4 && (navigator.deviceMemory || 4) <= 4;
const escritorio = matchMedia('(min-width: 900px)');
const capa = document.getElementById('rosa-escena');
const portada = document.getElementById('portada');
const slotCierre = document.querySelector('[data-rosa-slot="cierre"]');
const secciones = [...document.querySelectorAll('[data-rosa]')];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (v) => clamp(v, 0, 1);
const suave = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// Pose de la rosa por tipo de sección. x, y en fracción de media pantalla; s escala;
// a apertura (0 capullo, 1 abierta); o opacidad de la capa.
function pose(tipo, el) {
  const pc = escritorio.matches;
  switch (tipo) {
    case 'izq':
    case 'der': {
      const lado = tipo === 'izq' ? -1 : 1;
      if (pc) return { x: 0.52 * lado, y: 0, s: 0.72, a: 1, o: 1 };
      // celular: misma coreografía que escritorio, adaptada al ancho.
      // Secciones de texto: la rosa se asoma por su lado y el texto se recorre al otro (CSS).
      // Secciones a todo lo ancho (fotos, fecha, galería, álbum): solo se asoma por la orilla.
      return el.hasAttribute('data-ancho')
        ? { x: 0.95 * lado, y: 0.22, s: 0.36, a: 1, o: 1 }
        : { x: 0.68 * lado, y: 0.02, s: 0.44, a: 1, o: 1 };
    }
    case 'cierre': {
      // se posa sobre el hueco de la confirmación
      const r = slotCierre.getBoundingClientRect();
      const y = clamp(1 - (r.top + r.height * 0.4) / (innerHeight / 2), -0.8, 0.8);
      return { x: 0, y, s: pc ? 0.42 : 0.5, a: 0.06, o: 1 };
    }
    case 'final': return { x: 0, y: 0.38, s: pc ? 0.38 : 0.45, a: 0.45, o: pc ? 0.9 : 0.55 };
    default: return { x: 0, y: 0.04, s: 1, a: 1, o: 1 }; // fin de la portada
  }
}

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

  // ----- destellos alrededor de la flor (viajan con ella)
  const N = gamaBaja ? 55 : 110;
  const pos = new Float32Array(N * 3), fase = new Float32Array(N), tamanos = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = 0.9 + Math.random() * 1.5, th = Math.random() * Math.PI * 2, y = (Math.random() - 0.35) * 2.2;
    pos.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3);
    fase[i] = Math.random() * 6.28; tamanos[i] = 0.5 + Math.random() * 1.3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));
  geo.setAttribute('aTam', new THREE.BufferAttribute(tamanos, 1));
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
  const ancla = new THREE.Group(); // mueve rosa + destellos juntos por la pantalla
  ancla.add(rosa, destellos);
  scene.add(ancla);

  // ----- encuadre: esfera (centro, radio) vista desde una dirección
  const dir = new THREE.Vector3(), objetivo = new THREE.Vector3();
  const derecha = new THREE.Vector3(), arriba = new THREE.Vector3();
  let mediaAlto = 1, mediaAncho = 1; // media pantalla en unidades del mundo, en el plano del objetivo
  function encuadrar(cx, cy, radio, dy) {
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const dist = radio / Math.sin(Math.min(vfov, hfov) / 2);
    dir.set(0, dy, 1).normalize();
    objetivo.set(cx, cy, 0);
    camera.position.copy(objetivo).addScaledVector(dir, dist);
    camera.lookAt(objetivo);
    camera.updateMatrixWorld();
    mediaAlto = dist * Math.tan(vfov / 2);
    mediaAncho = mediaAlto * camera.aspect;
    derecha.setFromMatrixColumn(camera.matrixWorld, 0);
    arriba.setFromMatrixColumn(camera.matrixWorld, 1);
  }
  const holgura = () => (camera.aspect > 0.8 ? 1.22 : 1); // en pantallas anchas manda la altura
  function encuadrePortada(p) {
    const e = suave(0, 0.85, p);
    encuadrar(0, lerp(-0.62, 0.12, e), lerp(1.3 * holgura(), 1.0, e), lerp(0.22, 1.05, e));
  }

  // ----- estado
  const actual = { x: 0, y: 0, s: 1, a: 0, o: 1 };
  let forzado = null; // {modo, p} para capturas de respaldo
  let inclX = 0, inclY = 0, inclXObj = 0, inclYObj = 0;
  const reloj = new THREE.Clock();
  let t = 0, ultimoScroll = 0, cuadro = 0;
  addEventListener('scroll', () => { ultimoScroll = performance.now(); }, { passive: true });

  function tam() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }

  function progresoPortada() {
    const r = portada.getBoundingClientRect();
    const recorrido = r.height - innerHeight;
    return recorrido > 0 ? clamp01(-r.top / recorrido) : 1;
  }

  // pose objetivo según qué sección está al centro de la pantalla
  function poseScroll() {
    const rp = portada.getBoundingClientRect();
    if (rp.bottom >= innerHeight) return null; // seguimos en la portada
    const centro = innerHeight / 2;
    // ancla virtual: fin de la portada
    let prevC = rp.bottom - innerHeight, prevP = pose('portada');
    for (const sec of secciones) {
      const r = sec.getBoundingClientRect();
      const c = r.top + r.height / 2 - centro;
      const p = pose(sec.dataset.rosa, sec);
      if (c > 0) {
        let k = clamp01((0 - prevC) / (c - prevC));
        k = reducir ? (k < 0.5 ? 0 : 1) : suave(0.18, 0.82, k); // descansa y luego viaja
        return mezclar(prevP, p, k);
      }
      prevC = c; prevP = p;
    }
    return prevP;
  }
  const mezclar = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k), a: lerp(a.a, b.a, k), o: lerp(a.o, b.o, k) });

  function dibujar(dt) {
    t += dt;
    const suavizado = dt === 0 ? 1 : 1 - Math.exp(-dt * 6);
    let giro, destino;

    if (forzado?.modo === 'cierre') {
      encuadrar(0, -0.45, 1.2, 0.3);
      destino = { x: 0, y: 0, s: 1, a: 0.06, o: 1 };
      giro = 0.6;
    } else {
      const pPortada = forzado ? forzado.p : (reducir ? 1 : progresoPortada());
      const enScroll = forzado ? null : poseScroll();
      encuadrePortada(enScroll ? 1 : pPortada);
      if (!enScroll) {
        portada.style.setProperty('--p', pPortada.toFixed(4));
        destino = { x: 0, y: 0.04, s: 1, a: suave(0.04, 0.72, pPortada), o: 1 };
        giro = pPortada * 1.9;
      } else {
        portada.style.setProperty('--p', '1');
        destino = enScroll;
        giro = 1.9 + (scrollY - (portada.offsetHeight - innerHeight)) * 0.0014;
      }
      if (!reducir) giro += t * 0.12;
    }

    for (const k in destino) actual[k] += (destino[k] - actual[k]) * (forzado ? 1 : suavizado);
    if (reducir && !forzado) Object.assign(actual, destino);

    inclX += (inclXObj - inclX) * (1 - Math.exp(-dt * 4));
    inclY += (inclYObj - inclY) * (1 - Math.exp(-dt * 4));
    const a = reducir || forzado ? actual.a : actual.a * (0.97 + 0.03 * Math.sin(t * 1.3)); // respira
    petalos.morphTargetInfluences[0] = a;
    rosa.rotation.set(inclX, giro + inclY, 0);
    ancla.position.set(0, 0, 0)
      .addScaledVector(derecha, actual.x * mediaAncho)
      .addScaledVector(arriba, actual.y * mediaAlto);
    ancla.scale.setScalar(actual.s);
    destellos.rotation.y = -t * 0.05;
    matDestello.uniforms.uBrillo.value = lerp(0.25, 1, a) * clamp01(actual.o * 1.4);
    matDestello.uniforms.uT.value = t;
    capa.style.opacity = forzado ? 1 : actual.o.toFixed(3);
    renderer.render(scene, camera);
  }

  // calidad adaptativa: si va lento, baja la resolución una vez
  let muestras = 0, acumulado = 0, bajado = false;
  function medir(dt) {
    if (bajado || dt <= 0 || dt > 0.25) return;
    acumulado += dt; muestras++;
    if (muestras === 90) {
      if (acumulado / muestras > 1 / 40) {
        pr = 1; renderer.setPixelRatio(pr); matDestello.uniforms.uPR.value = pr; tam(); bajado = true;
      }
      muestras = 0; acumulado = 0;
    }
  }

  function bucle() {
    requestAnimationFrame(bucle);
    const dt = Math.min(reloj.getDelta(), 0.1);
    if (document.hidden) return;
    if (reducir) { if (performance.now() - ultimoScroll < 200) dibujar(0); return; }
    // sin scroll reciente basta con 30 fps (ahorra batería)
    cuadro++;
    const quieto = performance.now() - ultimoScroll > 800;
    if (quieto && cuadro % 2) return;
    dibujar(quieto ? dt * 2 : dt);
    medir(quieto ? dt * 2 : dt);
  }

  capa.appendChild(renderer.domElement);
  tam();
  addEventListener('resize', () => { tam(); dibujar(0); });
  if (!reducir) {
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      inclYObj = (e.clientX / innerWidth - 0.5) * 0.5;
      inclXObj = (e.clientY / innerHeight - 0.5) * 0.25;
    }, { passive: true });
  }
  document.body.classList.add('rosa-3d');
  dibujar(0);
  bucle();

  // gancho de depuración / captura de imágenes de respaldo: ?debug
  if (location.search.includes('debug')) {
    window.__rosa = {
      capturar(modo, p) {
        forzado = { modo, p };
        dibujar(0);
        const png = renderer.domElement.toDataURL('image/png');
        forzado = null;
        return png;
      },
      renderer,
    };
  }
}

iniciar().catch((err) => console.warn('Rosa 3D no disponible, se usa imagen de respaldo:', err));
