// Siempre empezar desde el principio al abrir o recargar (no restaurar la posición anterior)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);
addEventListener('load', () => scrollTo(0, 0));
addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); }); // volver con "atrás" también reinicia

(() => {
  const cfg = window.INVITACION;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Aviso breve ----------
  let avisoT;
  window.avisar = (texto) => {
    const a = $('#aviso');
    a.textContent = texto;
    a.classList.add('visible');
    clearTimeout(avisoT);
    avisoT = setTimeout(() => a.classList.remove('visible'), 2600);
  };

  // ---------- Sobre + música ----------
  const sobre = $('#sobre');
  const audio = $('#audio');
  const btnMusica = $('#musica');
  const btnCompartir = $('#compartir');

  function abrirSobre() {
    if (sobre.classList.contains('abriendo')) return;
    sobre.classList.add('abriendo');
    document.body.classList.remove('sobre-cerrado');
    if (location.search.includes('debug')) btnMusica.classList.add('pausada'); // pruebas: sin sonido
    else audio.play().catch(() => btnMusica.classList.add('pausada'));
    btnMusica.hidden = false;
    btnCompartir.hidden = false;
    requestAnimationFrame(() => btnCompartir.classList.add('entra'));
    setTimeout(() => sobre.remove(), 2400);
  }
  // el sello es el botón accesible; tocar cualquier parte del sobre también abre
  sobre.addEventListener('click', abrirSobre);
  sobre.addEventListener('pointerup', abrirSobre);

  btnMusica.addEventListener('click', () => {
    if (audio.paused) { audio.play(); btnMusica.classList.remove('pausada'); btnMusica.setAttribute('aria-label', 'Pausar música'); }
    else { audio.pause(); btnMusica.classList.add('pausada'); btnMusica.setAttribute('aria-label', 'Reproducir música'); }
  });
  // pausar si la persona cambia de app
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) { audio.pause(); audio.dataset.reanudar = '1'; }
    else if (!document.hidden && audio.dataset.reanudar) { audio.play().catch(() => {}); delete audio.dataset.reanudar; }
  });

  // ---------- Parallax del cielo ----------
  if (!reducir) {
    let pendiente = false;
    addEventListener('scroll', () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--sy', scrollY.toFixed(0));
        pendiente = false;
      });
    }, { passive: true });
  }

  // ---------- Aparición ----------
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visto'); obs.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.revelar').forEach((el) => obs.observe(el));
  // escalonar: cada elemento que aparece dentro de una misma sección entra un poco después
  $$('main > section').forEach((sec) => $$('.revelar', sec).forEach((el, i) => el.style.setProperty('--i', Math.min(i, 6))));

  // ---------- Cuenta regresiva ----------
  const objetivo = new Date(cfg.fechaEvento).getTime();
  const celdas = Object.fromEntries($$('#cuenta [data-c]').map((el) => [el.dataset.c, el]));
  const dos = (n) => String(n).padStart(2, '0');
  function tic() {
    const d = Math.max(0, objetivo - Date.now());
    celdas.dias.textContent = dos(Math.floor(d / 864e5));
    celdas.horas.textContent = dos(Math.floor(d / 36e5) % 24);
    celdas.minutos.textContent = dos(Math.floor(d / 6e4) % 60);
    celdas.segundos.textContent = dos(Math.floor(d / 1e3) % 60);
  }
  tic();
  setInterval(tic, 1000);

  // ---------- Visor de fotos (galería y álbum) ----------
  const visor = $('#visor');
  const visorImg = $('.visor-img', visor);
  let lista = [], idx = 0;
  function mostrar(i) {
    idx = (i + lista.length) % lista.length;
    visorImg.src = lista[idx];
    $('.visor-prev', visor).hidden = $('.visor-sig', visor).hidden = lista.length < 2;
  }
  window.visor = {
    abrir(urls, i = 0) {
      lista = urls; mostrar(i);
      visor.hidden = false;
      document.body.style.overflow = 'hidden';
      $('.visor-cerrar', visor).focus();
    },
  };
  function cerrarVisor() { visor.hidden = true; visorImg.removeAttribute('src'); document.body.style.overflow = ''; }
  $('.visor-cerrar', visor).addEventListener('click', cerrarVisor);
  $('.visor-prev', visor).addEventListener('click', () => mostrar(idx - 1));
  $('.visor-sig', visor).addEventListener('click', () => mostrar(idx + 1));
  visor.addEventListener('click', (e) => { if (e.target === visor) cerrarVisor(); });
  addEventListener('keydown', (e) => {
    if (visor.hidden) return;
    if (e.key === 'Escape') cerrarVisor();
    if (e.key === 'ArrowLeft') mostrar(idx - 1);
    if (e.key === 'ArrowRight') mostrar(idx + 1);
  });
  let x0 = null;
  visor.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) mostrar(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  const piezas = $$('#mosaico .m');
  const urlsGaleria = piezas.map((b) => b.dataset.full);
  piezas.forEach((b, i) => b.addEventListener('click', () => window.visor.abrir(urlsGaleria, i)));

  // ---------- Copiar cuenta ----------
  $$('[data-copiar]').forEach((b) => b.addEventListener('click', async () => {
    const texto = $(b.dataset.copiar).textContent.replace(/\s/g, '');
    try { await navigator.clipboard.writeText(texto); window.avisar('Cuenta copiada'); }
    catch { window.avisar(texto); }
  }));

  // ---------- Compartir invitación ----------
  // El menú se abre en el mismo toque (Safari lo exige) mientras el ícono gira y florece en rosa;
  // al cerrarse, la rosa vuelve a ser el ícono de compartir.
  let regreso;
  btnCompartir.addEventListener('click', async () => {
    clearTimeout(regreso);
    btnCompartir.classList.remove('vuelve', 'brilla', 'girando');
    void btnCompartir.offsetWidth; // reinicia la animación si se toca dos veces
    btnCompartir.classList.add('girando');
    const inicio = performance.now();

    const datos = {
      title: document.title,
      text: 'Te invito a celebrar mis XV años. ¡Una Noche de Zafiro!',
      url: location.origin + location.pathname,
    };
    if (navigator.share) {
      try { await navigator.share(datos); } catch (err) { if (err.name !== 'AbortError') console.warn(err); }
    } else {
      try { await navigator.clipboard.writeText(datos.url); window.avisar('Enlace copiado, ¡compártelo!'); }
      catch { window.avisar(datos.url); }
    }
    // deja ver la rosa abierta al menos ~2.5 s y luego regresa al ícono
    const espera = Math.max(1200, 2500 - (performance.now() - inicio));
    regreso = setTimeout(() => {
      btnCompartir.classList.remove('girando');
      btnCompartir.classList.add('vuelve');
    }, espera);
  });
  // un destello suave de vez en cuando para recordar que existe
  setInterval(() => {
    if (btnCompartir.hidden || btnCompartir.classList.contains('girando')) return;
    btnCompartir.classList.remove('brilla', 'vuelve'); void btnCompartir.offsetWidth; btnCompartir.classList.add('brilla');
  }, 14000);

  // ---------- WhatsApp: buzón y confirmación ----------
  const abrirWhatsApp = (texto) => {
    location.href = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(texto)}`;
  };
  $('#form-deseos').addEventListener('submit', (e) => {
    e.preventDefault();
    abrirWhatsApp(`Mensaje para tus XV:\n\n${$('#deseo').value.trim()}`);
  });
  $('#form-rsvp').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = $('#rsvp-nombre').value.trim();
    const asiste = $('input[name="asiste"]:checked').value === 'si';
    abrirWhatsApp(asiste
      ? `Hola, soy ${nombre} y confirmo mi asistencia a tus XV años.`
      : `Hola, soy ${nombre}. Lamentablemente no podré asistir a tus XV años. ¡Muchas felicidades!`);
  });
})();
