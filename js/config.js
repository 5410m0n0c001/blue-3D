// Datos del evento que usa el JavaScript. Los textos visibles viven en index.html.
// PENDIENTE (cliente): fecha real, WhatsApp, álbum.
window.INVITACION = {
  // Fecha y hora de la ceremonia con zona horaria (Hermosillo = UTC-7, sin horario de verano)
  fechaEvento: '2026-12-12T12:00:00-07:00',

  // WhatsApp que recibe confirmaciones y el buzón de deseos (lada + número, sin espacios)
  whatsapp: '527772383264',

  album: {
    supabaseUrl: 'https://fhnnqmbbeeobassvfeox.supabase.co',
    supabaseKey: 'sb_publishable_JV54Q8BDmg5XDXsq7NwO6Q_YDPBOLrm', // clave pública (publishable)
    bucket: 'fotos-album',
    albumId: 'xv-alison-2026',   // una carpeta y un id por evento
    fotosPorPagina: 24,
    // compresión en el navegador
    maxLado: 1600,               // px del lado largo de la foto grande
    maxBytes: 600 * 1024,        // objetivo de peso de la foto grande
    miniLado: 480,               // px del lado largo de la miniatura
    maxArchivos: 10,             // fotos por envío
  },
};
