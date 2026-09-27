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
- `supabase/setup.sql`: bucket con límite de 2 MB, sin UPDATE anónimo y validación de URLs.

## Probar en local
```bash
npx http-server . -p 4500 -c-1
```
Agrega `?debug` a la URL para probar sin música.

## Pendiente del cliente (Paloma, 28 nov 2026)
- [ ] Hora de la misa y de la recepción (cuenta regresiva y tarjeta del lugar)
- [ ] Programa del evento (se retiró la sección hasta tener horarios)
- [ ] WhatsApp que recibe confirmaciones y mensajes (`js/config.js`)
- [ ] ¿Padrinos? ¿"Formal" como código de vestimenta? (confirmado: sin azul marino ni dorado; hashtag #XVPaloma)

## Modelo 3D
Se genera con Blender 5.2 en modo headless desde `blender/rosa.py` (fuera de este repo)
y se optimiza con `gltf-transform optimize --compress meshopt`.
