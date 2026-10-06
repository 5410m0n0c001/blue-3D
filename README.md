# Noche de Zafiro · Invitación XV

Invitación digital estática (HTML/CSS/JS, sin build) con rosa 3D que se abre con el scroll y álbum de invitados en Supabase.

## Estructura
- `index.html`: todos los textos visibles (nombres, lugares, horarios, regalos).
- `js/config.js`: fecha para la cuenta regresiva, WhatsApp de confirmación y datos del álbum.
- `js/rosa3d.js`: rosa en Three.js (modelo `models/rosa.glb`, 85 KB, morph "Abierta") en una capa fija
  que acompaña todo el scroll. Cada sección dice dónde va la rosa con `data-rosa="izq|der|cierre|final"`;
  `data-ancho` marca secciones a todo lo ancho (en celular la rosa solo se asoma por la orilla).
  Sin WebGL usa `img/rosa-*.webp`. Con "reducir movimiento" no viaja.
- `img/marco-*.webp`: marco de rosas del original, recoloreado a plata.
- Botón "Compartir" (menú nativo; sin él, copia el enlace): al tocarlo el ícono gira y se abre una rosa.
- Al recargar, la invitación siempre empieza desde el sobre.
- `js/album.js`: "Tomar foto" (abre la cámara) y "Elegir de galería", con compresión en el navegador
  (~1600 px, ≤600 KB + miniatura de 480 px). QR para las mesas: `?action=take-photo` abre directo la cámara.
- `js/pases.js` + `img/pases/` + `p/N.html`: pases de 1 a 5 personas.
  Modo organizador: 3 toques en el nombre de la portada + clave (guardada como SHA-256). Solo mientras el panel está
  abierto: "Compartir" abre una ventana (nombre opcional + pases) y luego el menú nativo. El enlace
  `p/N.html?pases=5,2&para=…` muestra la tarjeta del pase como vista previa y redirige a la invitación,
  que saluda al invitado, muestra sus pases y limita la confirmación a sus lugares.
- `js/retos.js`: ruleta de retos (10 categorías × 20 = 200 retos) debajo del álbum; "Tomar foto del reto"
  abre la cámara del álbum.
- Cámara: en Android se usa una cámara dentro de la página (getUserMedia) para que el sistema no cierre
  el navegador por memoria; en iPhone, la cámara nativa. `diag/camara.html` compara ambas en un equipo.
- `supabase/setup.sql`: bucket con límite de 2 MB, sin UPDATE anónimo y validación de URLs.

## Probar en local
```bash
npx http-server . -p 4500 -c-1
```
Agrega `?debug` a la URL para probar sin música.

## Pendiente del cliente (Paloma, 28 nov 2026)
- [x] Programa: misa 3:30 pm … fin de fiesta 3:30 am
- [x] WhatsApp de confirmaciones: 777 441 9071
- [ ] ¿Padrinos? (confirmado: vestimenta sin azul marino ni dorado; hashtag #XVPaloma)

## Modelo 3D
Se genera con Blender 5.2 en modo headless desde `blender/rosa.py` (fuera de este repo)
y se optimiza con `gltf-transform optimize --compress meshopt`.
