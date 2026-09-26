# Noche de Zafiro · Invitación XV

Invitación digital estática (HTML/CSS/JS, sin build) con rosa 3D que se abre con el scroll y álbum de invitados en Supabase.

## Estructura
- `index.html`: todos los textos visibles (nombres, lugares, horarios, regalos).
- `js/config.js`: fecha para la cuenta regresiva, WhatsApp de confirmación y datos del álbum.
- `js/rosa3d.js`: rosa en Three.js (modelo `models/rosa.glb`, 85 KB, morph "Abierta") en una capa fija
  que acompaña todo el scroll. Cada sección dice dónde va la rosa con `data-rosa="izq|der|cierre|final"`.
  Sin WebGL usa `img/rosa-*.webp`. Con "reducir movimiento" no viaja.
- `img/marco-*.webp`: marco de rosas del original, recoloreado a plata.
- Botón "Compartir" (menú nativo; sin él, copia el enlace): al tocarlo el ícono gira y se abre una rosa.
- Al recargar, la invitación siempre empieza desde el sobre.
- `js/album.js`: subida con compresión en el navegador (~1600 px, ≤600 KB + miniatura de 480 px).
- `supabase/setup.sql`: bucket con límite de 2 MB, sin UPDATE anónimo y validación de URLs.

## Probar en local
```bash
npx http-server . -p 4500 -c-1
```
Agrega `?debug` a la URL para probar sin música.

## Antes de entregar al cliente
- [ ] Nombre, papás, padrinos, fecha, lugares y horarios reales (`index.html`)
- [ ] `fechaEvento` y `whatsapp` en `js/config.js`
- [ ] Mesa de regalos, cuenta bancaria, hashtag
- [ ] `albumId` único por evento; proyecto de Supabase activo el día del evento
- [ ] Más fotos de la quinceañera en la galería (`img/`)

## Modelo 3D
Se genera con Blender 5.2 en modo headless desde `blender/rosa.py` (fuera de este repo)
y se optimiza con `gltf-transform optimize --compress meshopt`.
