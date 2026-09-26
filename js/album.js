// Álbum de invitados en Supabase, con compresión en el navegador.
// Cada foto se sube en dos archivos al bucket:
//   <albumId>/<id>.jpg    grande (≤ maxLado px, ~maxBytes)
//   <albumId>/<id>_t.jpg  miniatura para la cuadrícula (≤ miniLado px)
// La tabla `fotos` guarda solo la URL de la grande + album_id.
(() => {
  const cfg = window.INVITACION.album;
  const $ = (s) => document.querySelector(s);
  const grid = $('#album-grid'), estado = $('#album-estado'), input = $('#album-input');
  const btnSubir = $('#album-subir'), btnMas = $('#album-mas');

  if (!window.supabase) { mostrarEstado('El álbum no está disponible en este momento.', true); return; }
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  const PREFIJO = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/${cfg.albumId}/`;
  const urls = [];          // URLs grandes en orden, para el visor
  const vistas = new Set(); // evita duplicados (tiempo real + paginación)
  let pagina = 0;

  function mostrarEstado(texto, error = false, progreso = null) {
    estado.classList.toggle('error', error);
    estado.textContent = texto;
    if (progreso !== null) {
      const barra = document.createElement('div');
      barra.className = 'barra';
      const i = document.createElement('i');
      i.style.width = `${Math.round(progreso * 100)}%`;
      barra.append(i);
      estado.append(barra);
    }
  }

  // ---------- Compresión ----------
  async function decodificar(file) {
    if ('createImageBitmap' in window) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* sigue */ }
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally { URL.revokeObjectURL(url); }
  }

  function aBlob(fuente, lado, calidad) {
    const w0 = fuente.width, h0 = fuente.height;
    const k = Math.min(1, lado / Math.max(w0, h0));
    const c = document.createElement('canvas');
    c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fuente, 0, 0, c.width, c.height);
    return new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error('toBlob'))), 'image/jpeg', calidad));
  }

  async function comprimir(file) {
    const fuente = await decodificar(file);
    let calidad = 0.82, grande = await aBlob(fuente, cfg.maxLado, calidad);
    while (grande.size > cfg.maxBytes && calidad > 0.5) {
      calidad -= 0.1;
      grande = await aBlob(fuente, cfg.maxLado, calidad);
    }
    const mini = await aBlob(fuente, cfg.miniLado, 0.72);
    if (fuente.close) fuente.close();
    return { grande, mini };
  }

  // ---------- Subida ----------
  const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  async function subirUna(file) {
    const { grande, mini } = await comprimir(file);
    const base = `${cfg.albumId}/${id()}`;
    const opts = { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false };
    const r1 = await db.storage.from(cfg.bucket).upload(`${base}.jpg`, grande, opts);
    if (r1.error) throw r1.error;
    const r2 = await db.storage.from(cfg.bucket).upload(`${base}_t.jpg`, mini, opts);
    if (r2.error) console.warn('Miniatura no subida, se usará la grande', r2.error);
    const url = db.storage.from(cfg.bucket).getPublicUrl(`${base}.jpg`).data.publicUrl;
    const r3 = await db.from('fotos').insert({ url, album_id: cfg.albumId });
    if (r3.error) throw r3.error;
    return { grande: grande.size, original: file.size };
  }

  btnSubir.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const archivos = [...input.files].filter((f) => f.type.startsWith('image/') || f.type === '').slice(0, cfg.maxArchivos);
    input.value = '';
    if (!archivos.length) return;
    if (input.files.length > cfg.maxArchivos) window.avisar?.(`Máximo ${cfg.maxArchivos} fotos por envío`);

    btnSubir.disabled = true;
    let ok = 0, fallos = 0, ahorro = 0;
    for (let n = 0; n < archivos.length; n++) {
      mostrarEstado(`Subiendo ${n + 1} de ${archivos.length}…`, false, n / archivos.length);
      try {
        const r = await subirUna(archivos[n]);
        ok++; ahorro += Math.max(0, r.original - r.grande);
      } catch (err) {
        console.error('Error al subir', err);
        fallos++;
      }
    }
    btnSubir.disabled = false;
    if (ok && !fallos) mostrarEstado(ok === 1 ? '¡Tu foto ya está en el álbum!' : `¡Tus ${ok} fotos ya están en el álbum!`);
    else if (ok) mostrarEstado(`Se subieron ${ok}; ${fallos} no se pudieron subir. Intenta de nuevo con esas.`, true);
    else mostrarEstado('No se pudo subir. Revisa tu conexión e intenta de nuevo.', true);
    if (ok) { console.info(`Compresión: ${(ahorro / 1048576).toFixed(1)} MB ahorrados`); recargar(); }
  });

  // ---------- Galería ----------
  const miniDe = (url) => url.replace(/\.jpg$/, '_t.jpg');

  function crearFoto(url) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Ver foto del álbum');
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('load', () => img.classList.add('cargada'), { once: true });
    img.addEventListener('error', () => { if (img.src !== url) img.src = url; }, { once: true });
    img.src = miniDe(url);
    b.append(img);
    b.addEventListener('click', () => window.visor.abrir(urls, urls.indexOf(url)));
    return b;
  }

  function vacio() {
    grid.replaceChildren();
    const d = document.createElement('p');
    d.className = 'album-vacio';
    d.textContent = 'Aún no hay fotos. ¡Sé la primera persona en compartir un recuerdo!';
    grid.append(d);
  }

  // solo se muestran URLs de este bucket y este álbum (nada inyectado en la tabla)
  const valida = (url) => typeof url === 'string' && url.startsWith(PREFIJO) && /^[\w\-./:]+$/.test(url);

  async function cargarPagina() {
    const desde = pagina * cfg.fotosPorPagina;
    const { data, error } = await db.from('fotos')
      .select('url, created_at')
      .eq('album_id', cfg.albumId)
      .order('created_at', { ascending: false })
      .range(desde, desde + cfg.fotosPorPagina); // pide una de más para saber si hay otra página
    if (error) throw error;
    const hayMas = data.length > cfg.fotosPorPagina;
    const filas = data.slice(0, cfg.fotosPorPagina).filter((f) => valida(f.url) && !vistas.has(f.url));
    if (pagina === 0 && !filas.length) vacio();
    else {
      grid.querySelector('.album-vacio')?.remove();
      filas.forEach((f) => { vistas.add(f.url); urls.push(f.url); grid.append(crearFoto(f.url)); });
    }
    btnMas.hidden = !hayMas;
    pagina++;
  }

  async function recargar() {
    pagina = 0; urls.length = 0; vistas.clear(); grid.replaceChildren();
    try { await cargarPagina(); return true; }
    catch (err) {
      console.warn('Álbum no disponible', err);
      mostrarEstado('El álbum se activará el día del evento.');
      btnSubir.hidden = true;
      return false;
    }
  }

  btnMas.addEventListener('click', async () => {
    btnMas.disabled = true;
    try { await cargarPagina(); } finally { btnMas.disabled = false; }
  });

  // nuevas fotos en tiempo real (solo al principio de la cuadrícula)
  function tiempoReal() {
    db.channel(`fotos-${cfg.albumId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fotos', filter: `album_id=eq.${cfg.albumId}` }, ({ new: fila }) => {
        if (!valida(fila.url) || vistas.has(fila.url)) return;
        vistas.add(fila.url); urls.unshift(fila.url);
        grid.querySelector('.album-vacio')?.remove();
        grid.prepend(crearFoto(fila.url));
      })
      .subscribe();
  }

  // carga diferida: solo cuando el álbum se acerca a la pantalla
  const io = new IntersectionObserver((e) => {
    if (!e[0].isIntersecting) return;
    io.disconnect();
    recargar().then((ok) => { if (ok) tiempoReal(); });
  }, { rootMargin: '600px 0px' });
  io.observe($('#album'));
})();
