// Pases de acceso.
//  1) Invitado: el enlace trae ?pases=5,2&para=Familia%20López → saludo, sección "Tus pases"
//     y confirmación limitada a sus lugares. Nada se guarda en servidor: todo va en el enlace.
//  2) Organizador: 3 toques en el nombre de la portada + clave. En ese celular, el botón
//     Compartir abre primero la ventana para elegir nombre y pases, y luego el menú nativo.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const CLAVE_SHA256 = '87176a1aed0cf090ff28e89a643fd975c58a78583d789a7c3c46ca39a1f265f8';
  const BASE = location.origin + location.pathname.replace(/[^/]*$/, ''); // carpeta de la invitación
  const MAX_PREVIA = 20; // hay imagen de vista previa (p/N.html) para 1 a 20 personas
  const plural = (n, uno, varios) => (n === 1 ? uno : varios);

  // ================= 1) Invitado con pases =================
  const q = new URLSearchParams(location.search);
  const pases = (q.get('pases') || '').split(',').map(Number)
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5).slice(0, 12);
  const para = (q.get('para') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const lugares = pases.reduce((a, b) => a + b, 0);
  window.invitado = { para, pases, lugares };

  if (para) {
    const p = $('#para-quien');
    const etiqueta = document.createElement('span');
    etiqueta.textContent = 'Invitación para';
    p.append(etiqueta, document.createTextNode(para)); // texto plano: nunca HTML del enlace
    p.hidden = false;
  }

  const seccion = $('#mis-pases');
  if (!lugares) {
    seccion.remove(); // sin pases la invitación queda igual que siempre
  } else {
    $('#mis-pases-texto').textContent =
      `${para ? `${para}, tienes` : 'Tienes'} ${lugares} ${plural(lugares, 'lugar reservado', 'lugares reservados')}.`;
    const urls = pases.map((n) => `img/pases/pase-${n}.jpg`);
    const grid = $('#mis-pases-grid');
    pases.forEach((n, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Ver pase para ${n} ${plural(n, 'persona', 'personas')}`);
      const img = document.createElement('img');
      img.src = urls[i]; img.alt = `Pase para ${n} ${plural(n, 'persona', 'personas')}`; img.loading = 'lazy';
      b.append(img);
      b.addEventListener('click', () => window.visor.abrir(urls, i));
      grid.append(b);
    });

    // confirmación: elegir cuántos asisten, hasta su máximo
    const sel = $('#rsvp-cuantos');
    for (let n = lugares; n >= 1; n--) {
      const o = document.createElement('option');
      o.value = n; o.textContent = `${n} ${plural(n, 'persona', 'personas')}`;
      sel.append(o);
    }
    $('#rsvp-max').textContent = `de ${lugares} ${plural(lugares, 'lugar reservado', 'lugares reservados')}`;
    const caja = $('#rsvp-lugares');
    const actualizar = () => { caja.hidden = $('input[name="asiste"]:checked').value !== 'si'; };
    document.querySelectorAll('input[name="asiste"]').forEach((r) => r.addEventListener('change', actualizar));
    actualizar();
    if (para) $('#rsvp-nombre').value = para;
  }

  // ================= 2) Modo organizador =================
  const LLAVE = 'xv-paloma-organizador';
  let activo = false;
  try { activo = localStorage.getItem(LLAVE) === '1'; } catch { /* sin almacenamiento */ }
  const btnCompartir = $('#compartir');
  const textoBoton = btnCompartir.querySelector('span');
  function marcar() {
    document.body.classList.toggle('organizador-activo', activo);
    textoBoton.textContent = activo ? 'Enviar pases' : 'Compartir';
  }
  marcar();

  // --- 3 toques en el nombre de la portada abren la clave
  const nombrePortada = $('.portada-nombre .nombre-script');
  let toques = 0, reinicio;
  nombrePortada.addEventListener('click', () => {
    toques++;
    clearTimeout(reinicio);
    reinicio = setTimeout(() => { toques = 0; }, 900);
    if (toques >= 3) { toques = 0; activo ? window.avisar('Modo organizador ya activo') : abrirPin(); }
  });

  const fondoPin = $('#org-pin'), inputPin = $('#org-pin-input'), errorPin = $('#org-pin-error');
  function abrirPin() {
    fondoPin.hidden = false; errorPin.hidden = true; inputPin.value = '';
    setTimeout(() => inputPin.focus(), 50);
  }
  const cerrarPin = () => { fondoPin.hidden = true; };
  $('#org-pin-cancelar').addEventListener('click', cerrarPin);
  fondoPin.addEventListener('click', (e) => { if (e.target === fondoPin) cerrarPin(); });

  async function sha256(texto) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  $('#org-pin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (await sha256(inputPin.value.trim()) !== CLAVE_SHA256) {
      errorPin.hidden = false; inputPin.select(); return;
    }
    activo = true;
    try { localStorage.setItem(LLAVE, '1'); } catch { /* sin almacenamiento: dura esta visita */ }
    marcar(); cerrarPin();
    window.avisar('Modo organizador activado');
  });

  // --- ventana de envío
  const fondoEnvio = $('#org-envio'), inputNombre = $('#org-nombre');
  const elegidos = $('#org-elegidos'), total = $('#org-total'), adjuntar = $('#org-adjuntar');
  let seleccion = [];
  const archivos = {}; // imágenes de pases precargadas (el menú nativo exige compartir en el mismo toque)

  function precargar() {
    for (let n = 1; n <= 5; n++) {
      if (archivos[n]) continue;
      fetch(`img/pases/pase-${n}.jpg`).then((r) => r.blob()).then((b) => { archivos[n] = b; }).catch(() => {});
    }
  }

  function pintar() {
    elegidos.replaceChildren();
    seleccion.forEach((n, i) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'org-chip';
      chip.textContent = `Pase de ${n} ×`;
      chip.setAttribute('aria-label', `Quitar pase de ${n}`);
      chip.addEventListener('click', () => { seleccion.splice(i, 1); pintar(); });
      elegidos.append(chip);
    });
    const t = seleccion.reduce((a, b) => a + b, 0);
    total.textContent = t
      ? `Total: ${t} ${plural(t, 'lugar', 'lugares')}`
      : 'Sin pases: se enviará solo la invitación.';
    adjuntar.closest('label').hidden = !t;
  }

  document.querySelectorAll('#org-pases button').forEach((b) => b.addEventListener('click', () => {
    if (seleccion.length >= 12) return;
    seleccion.push(+b.dataset.n); pintar();
  }));

  function abrir() {
    precargar();
    seleccion = []; inputNombre.value = ''; pintar();
    fondoEnvio.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function cerrar() { fondoEnvio.hidden = true; document.body.style.overflow = ''; }
  $('#org-cerrar').addEventListener('click', cerrar);
  fondoEnvio.addEventListener('click', (e) => { if (e.target === fondoEnvio) cerrar(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { cerrar(); cerrarPin(); } });

  $('#org-salir').addEventListener('click', () => {
    activo = false;
    try { localStorage.removeItem(LLAVE); } catch { /* sin almacenamiento */ }
    marcar(); cerrar();
    window.avisar('Modo organizador desactivado');
  });

  $('#org-enviar').addEventListener('click', () => {
    const nombre = inputNombre.value.replace(/\s+/g, ' ').trim().slice(0, 60);
    const t = seleccion.reduce((a, b) => a + b, 0);
    const params = new URLSearchParams();
    if (t) params.set('pases', seleccion.join(','));
    if (nombre) params.set('para', nombre);
    // con pases, el enlace apunta a p/N.html: su vista previa en WhatsApp/Messenger es la tarjeta del pase
    const pagina = t && t <= MAX_PREVIA ? `${BASE}p/${t}.html` : BASE;
    const url = pagina + (params.toString() ? `?${params}` : '');

    let texto = `${nombre ? `¡Hola, ${nombre}! ` : '¡Hola! '}Te invito a celebrar mis XV años el sábado 28 de noviembre de 2026.`;
    if (t) {
      const desglose = seleccion.length > 1 ? ` (${seleccion.map((n) => `pase de ${n}`).join(' + ')})` : '';
      texto += ` Tienes ${t} ${plural(t, 'lugar reservado', 'lugares reservados')}${desglose}.`;
    }
    texto += `\n\nAbre tu invitación: ${url}`;

    // el enlace va dentro del texto: algunas apps descartan el campo url cuando hay imágenes
    const datos = { title: document.title, text: texto };
    if (t && adjuntar.checked) {
      const files = seleccion.map((n, i) => archivos[n] && new File([archivos[n]], `pase-${n}-personas-${i + 1}.jpg`, { type: 'image/jpeg' }));
      if (files.every(Boolean) && (!navigator.canShare || navigator.canShare({ files, text: texto }))) datos.files = files;
    }
    cerrar();
    window.compartir(datos); // mismo menú nativo: WhatsApp, Messenger, correo, etc.
  });

  window.organizador = { activo: () => activo, abrir };
})();
