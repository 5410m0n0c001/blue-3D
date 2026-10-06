// Datos del evento que usa el JavaScript. Los textos visibles viven en index.html.
window.INVITACION = {
  // Inicio de la misa con zona horaria (Morelos = UTC-6)
  fechaEvento: '2026-11-28T15:30:00-06:00',

  // WhatsApp que recibe confirmaciones y el buzón de deseos (lada + número, sin espacios)
  whatsapp: '527774419071',

  album: {
    supabaseUrl: 'https://fhnnqmbbeeobassvfeox.supabase.co',
    supabaseKey: 'sb_publishable_JV54Q8BDmg5XDXsq7NwO6Q_YDPBOLrm', // clave pública (publishable)
    bucket: 'fotos-album',
    albumId: 'xv-paloma-28nov',  // álbum limpio para el evento (xv-paloma-2026 quedó con fotos de prueba)
    fotosPorPagina: 24,
    // compresión en el navegador
    maxLado: 1600,               // px del lado largo de la foto grande
    maxBytes: 600 * 1024,        // objetivo de peso de la foto grande
    miniLado: 480,               // px del lado largo de la miniatura
    maxArchivos: 10,             // fotos por envío
  },
};
