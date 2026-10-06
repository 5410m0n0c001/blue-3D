// Ruleta de retos fotográficos (debajo del álbum).
// 10 categorías × 20 retos = 200. La ruleta cae en una categoría y se elige un reto al azar
// de ella (sin repetir hasta agotarlos). "Tomar foto del reto" abre la cámara del álbum.
(() => {
  const RETOS = {
    Selfie: [
      'Tómate una selfie con alguien que acabas de conocer esta noche.',
      'Selfie con la persona más elegante de tu mesa.',
      'Selfie con la quinceañera haciendo los dos la misma cara.',
      'Selfie con alguien que lleve algo azul.',
      'Selfie grupal con todos los de tu mesa.',
      'Selfie con el DJ o con alguien de la banda.',
      'Selfie con la persona de mayor edad que encuentres.',
      'Selfie con la persona más pequeña de la fiesta (con permiso de sus papás).',
      'Selfie con alguien que tenga tu mismo nombre o tu misma inicial.',
      'Selfie con alguien que lleve lentes.',
      'Selfie desde abajo, como si fueras muy alto.',
      'Selfie con el pastel de fondo.',
      'Selfie con alguien que no hayas visto en más de un año.',
      'Selfie con un mesero (pídele permiso y dale las gracias).',
      'Selfie guiñando el ojo con la persona de tu derecha.',
      'Selfie con alguien que tenga el cabello más largo que tú.',
      'Selfie con las luces de la fiesta detrás.',
      'Selfie con tres personas de mesas distintas.',
      'Selfie con alguien que esté celebrando su cumpleaños este mes.',
      'Selfie con tu mejor amigo de la fiesta haciendo corazón con las manos.',
    ],
    Baile: [
      'Foto de alguien bailando que juró que no iba a bailar.',
      'Foto bailando con alguien que no conocías.',
      'Foto del mejor paso de baile de la noche.',
      'Foto de un trenecito en la pista.',
      'Foto de una pareja bailando el vals.',
      'Foto de la pista llena a todo lo que da.',
      'Foto de alguien bailando con los ojos cerrados.',
      'Foto de un baile en círculo con la quinceañera al centro.',
      'Foto de alguien bailando con su abuelita o abuelito.',
      'Foto de un niño bailando como si nadie lo viera.',
      'Foto de tres generaciones bailando juntas.',
      'Foto haciendo la misma coreografía que tu mesa.',
      'Foto de alguien bailando con un objeto como pareja.',
      'Foto de los zapatos de alguien que ya no aguantó y bailó descalzo.',
      'Foto saltando en la pista: que salgan en el aire.',
      'Foto de una vuelta de baile congelada en el momento justo.',
      'Foto del papá de la quinceañera bailando.',
      'Foto bailando con la quinceañera.',
      'Foto de alguien enseñándole un paso a otra persona.',
      'Foto de la banda en su mejor momento.',
    ],
    Gracioso: [
      'Haz tu cara más graciosa y que alguien te tome la foto.',
      'Foto de toda tu mesa haciendo cara de sorpresa.',
      'Foto imitando la pose de una estatua famosa.',
      'Foto de alguien con un bigote hecho con su cabello o una servilleta.',
      'Foto haciendo como que cargas a alguien con una mano (perspectiva).',
      'Foto con la cara más seria posible mientras todos ríen alrededor.',
      'Foto de dos personas intercambiando un accesorio (lentes, saco, collar).',
      'Foto imitando la pose de la quinceañera en su retrato.',
      'Foto de alguien fingiendo dormir en su silla.',
      'Foto de tu mesa como si fuera la portada de una banda de rock.',
      'Foto de alguien haciendo de mesero por un momento.',
      'Foto "bizcos" de tu mesa completa.',
      'Foto de la reacción más exagerada a un chiste.',
      'Foto de alguien escondido detrás de un centro de mesa.',
      'Foto haciendo como que sostienes la luna o una luz con la mano.',
      'Foto con la peor pose de modelo que se te ocurra.',
      'Foto de alguien comiendo el postre como si fuera lo más delicioso del mundo.',
      'Foto de dos personas con la misma pose sin ponerse de acuerdo.',
      'Foto imitando a alguien de tu mesa (con cariño).',
      'Foto de un "abrazo de oso" sorpresa.',
    ],
    Paloma: [
      'Foto de Paloma riendo a carcajadas.',
      'Foto de Paloma sin que se dé cuenta.',
      'Foto de Paloma con su papá.',
      'Foto de Paloma con su mamá.',
      'Foto de los detalles del vestido de Paloma.',
      'Foto de Paloma en su vals.',
      'Foto de Paloma con todas sus amigas.',
      'Foto de Paloma cortando el pastel.',
      'Foto de Paloma bailando con la banda.',
      'Foto de Paloma abrazando a alguien especial.',
      'Foto de Paloma desde un ángulo creativo.',
      'Foto de Paloma con la persona que viajó más lejos para venir.',
      'Foto de Paloma con sus abuelos.',
      'Foto de Paloma con el DJ.',
      'Foto de Paloma con tu mesa completa.',
      'Foto de los zapatos de Paloma.',
      'Foto de Paloma recibiendo los sobres en la lluvia de sobres.',
      'Foto de Paloma con las luces de la noche de fondo.',
      'Foto de la reacción de Paloma en su momento favorito.',
      'Foto haciéndole a Paloma un corazón con las manos.',
    ],
    Mesa: [
      'Foto de tu mesa brindando con lo que tengan en la mano.',
      'Foto de tu mesa formando la palabra XV con los brazos.',
      'Foto de tu mesa haciendo una ola.',
      'Foto de tu mesa con el centro de mesa como protagonista.',
      'Foto de tu mesa vista desde arriba.',
      'Foto de tu mesa con todos mirando a la cámara... menos uno.',
      'Foto de tu mesa imitando una pintura famosa.',
      'Foto de tu mesa como si fueran un equipo deportivo.',
      'Foto de tu mesa saludando a la mesa de al lado.',
      'Foto de tu mesa con todos de pie en sus sillas (con cuidado).',
      'Foto de tu mesa haciendo un corazón gigante.',
      'Foto de tu mesa en orden de estatura.',
      'Foto de tu mesa con todos señalando a quien llegó primero.',
      'Foto de tu mesa mostrando sus sobres para la lluvia de sobres.',
      'Foto de tu mesa con cara de "¡ya sirvan la comida!".',
      'Foto de tu mesa con una mesa vecina, todos juntos.',
      'Foto de tu mesa tomados de las manos.',
      'Foto de tu mesa saltando al mismo tiempo.',
      'Foto de tu mesa posando como portada de revista.',
      'Foto de tu mesa con todos usando algo de color azul.',
    ],
    Familia: [
      'Foto de tres generaciones de una misma familia.',
      'Foto de la familia de Paloma completa.',
      'Foto de unos abuelos tomados de la mano.',
      'Foto de hermanos imitando una foto de cuando eran niños.',
      'Foto de primos que no se veían hace mucho.',
      'Foto de alguien contando una anécdota de Paloma de pequeña.',
      'Foto de una pareja que lleva muchos años junta.',
      'Foto de una mamá mirando con orgullo.',
      'Foto de un papá emocionado.',
      'Foto de la persona más consentidora de la familia.',
      'Foto de todos los tíos juntos.',
      'Foto de todas las tías juntas.',
      'Foto de los niños de la fiesta.',
      'Foto de un abrazo de reencuentro.',
      'Foto de la familia que viajó desde más lejos.',
      'Foto de padrinos o personas especiales con Paloma.',
      'Foto de alguien secándose una lágrima de emoción.',
      'Foto de dos generaciones bailando la misma canción.',
      'Foto de tu familia con Paloma.',
      'Foto de la persona que más fotos ha tomado hoy.',
    ],
    Detalles: [
      'Foto del pastel antes de que lo corten.',
      'Foto de la decoración que más te guste.',
      'Foto de un arreglo de flores de cerca.',
      'Foto de las luces del jardín.',
      'Foto de la mesa de postres.',
      'Foto del platillo más bonito de la cena.',
      'Foto de los zapatos más originales de la fiesta.',
      'Foto del accesorio más brillante que encuentres.',
      'Foto de algo azul zafiro en el lugar.',
      'Foto de la entrada del jardín.',
      'Foto de una vela encendida.',
      'Foto de los instrumentos de la banda.',
      'Foto de la cabina del DJ.',
      'Foto de algo que tenga forma de corazón.',
      'Foto del cielo de la noche.',
      'Foto de los sobres de la lluvia de sobres.',
      'Foto del detalle más pequeño que nadie notó.',
      'Foto de la mesa principal.',
      'Foto de las manos de alguien con un anillo o pulsera especial.',
      'Foto de un reflejo bonito (espejo, vidrio, agua).',
    ],
    Pose: [
      'Foto posando como estrella de cine en la alfombra roja.',
      'Foto con pose de superhéroe.',
      'Foto de espaldas mirando por encima del hombro.',
      'Foto con pose de portada de disco.',
      'Foto saltando con los brazos arriba.',
      'Foto a contraluz, solo tu silueta.',
      'Foto con pose de "pensador".',
      'Foto con pose de baile congelada.',
      'Foto de perfil, muy elegante.',
      'Foto con pose de modelo de pasarela caminando.',
      'Foto en pareja espalda con espalda.',
      'Foto con una flor en la mano.',
      'Foto con pose de agente secreto.',
      'Foto con pose de "¡lo logré!".',
      'Foto mirando al cielo como en videoclip.',
      'Foto con el saco o el chal volando.',
      'Foto con pose de foto de graduación.',
      'Foto a lo lejos, haciéndote pequeño en el jardín.',
      'Foto con pose de reina o rey de la noche.',
      'Foto con la pose que haría Paloma.',
    ],
    Momentos: [
      'Foto del momento exacto en que Paloma entra al salón.',
      'Foto de la primera pieza del vals.',
      'Foto de la reacción de alguien durante el vals.',
      'Foto del brindis.',
      'Foto del momento del pastel.',
      'Foto del momento en que llega la banda.',
      'Foto de la pista en su momento más prendido.',
      'Foto de una carcajada auténtica.',
      'Foto de alguien abrazando a Paloma.',
      'Foto de una mirada cómplice entre dos personas.',
      'Foto de la lluvia de sobres.',
      'Foto de alguien cantando a todo pulmón.',
      'Foto de un aplauso para Paloma.',
      'Foto de un momento tierno entre dos personas.',
      'Foto del último baile de la noche.',
      'Foto de la misa.',
      'Foto del cóctel de bienvenida.',
      'Foto de la cena servida.',
      'Foto de alguien grabando un video para Paloma.',
      'Foto del momento que más te emocionó.',
    ],
    Sorpresa: [
      'Pídele a un desconocido que te tome la foto que él quiera.',
      'Foto con la persona que traiga el atuendo más llamativo.',
      'Foto haciendo una figura con las manos y alguien más.',
      'Foto con alguien que hable otro idioma (o que lo intente).',
      'Foto de algo que te haga reír.',
      'Foto con la persona que tenga la risa más contagiosa.',
      'Foto con alguien que esté de cumpleaños o aniversario.',
      'Foto con la persona que llegó primero a la fiesta.',
      'Foto con la persona que más ha bailado.',
      'Foto escribiendo "XV" con algo de la mesa.',
      'Foto con alguien que haya conocido a Paloma desde bebé.',
      'Foto con alguien que vino de otra ciudad.',
      'Foto con alguien a quien quieras agradecerle algo.',
      'Foto haciendo una pirámide humana pequeña y segura.',
      'Foto que cuente una historia sin palabras.',
      'Foto con la persona que tenga los zapatos más brillantes.',
      'Foto de alguien que te recuerde a un personaje de película.',
      'Foto con alguien que lleve flores.',
      'Foto con el último invitado que llegó.',
      'Foto libre: sorprende a Paloma con tu mejor idea.',
    ],
  };
  const CATEGORIAS = Object.keys(RETOS);
  const SEG = 360 / CATEGORIAS.length;
  const $ = (s) => document.querySelector(s);
  const svg = $('#ruleta-svg');
  if (!svg) return;
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- dibujar la ruleta (SVG) ----------
  const NS = 'http://www.w3.org/2000/svg';
  const R = 96;
  const punto = (ang, r) => {
    const a = (ang - 90) * Math.PI / 180; // 0° arriba, sentido horario
    return [r * Math.cos(a), r * Math.sin(a)];
  };
  const rueda = document.createElementNS(NS, 'g');
  rueda.setAttribute('class', 'ruleta-rueda');
  CATEGORIAS.forEach((cat, i) => {
    const [x1, y1] = punto(i * SEG, R), [x2, y2] = punto((i + 1) * SEG, R);
    const sector = document.createElementNS(NS, 'path');
    sector.setAttribute('d', `M0 0L${x1.toFixed(2)} ${y1.toFixed(2)}A${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z`);
    sector.setAttribute('class', i % 2 ? 'sector-b' : 'sector-a');
    rueda.append(sector);
    const t = document.createElementNS(NS, 'text');
    const medio = i * SEG + SEG / 2;
    // texto a lo largo del radio, leyendo del centro hacia afuera
    t.setAttribute('transform', `rotate(${medio - 90}) translate(${R * 0.6} 0)`);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.textContent = cat;
    rueda.append(t);
  });
  const aro = document.createElementNS(NS, 'circle');
  aro.setAttribute('r', R); aro.setAttribute('class', 'ruleta-aro');
  rueda.append(aro);
  svg.append(rueda);

  // ---------- girar ----------
  const btnGirar = $('#ruleta-girar'), carta = $('#reto-carta');
  const usados = Object.fromEntries(CATEGORIAS.map((c) => [c, []]));
  let giro = 0, girando = false;
  window.retoActual = null;

  function elegirReto(cat) {
    const lista = RETOS[cat];
    if (usados[cat].length >= lista.length) usados[cat] = [];
    let i;
    do { i = Math.floor(Math.random() * lista.length); } while (usados[cat].includes(i));
    usados[cat].push(i);
    return lista[i];
  }

  function girar() {
    if (girando) return;
    girando = true;
    btnGirar.disabled = true;
    carta.hidden = true;
    const destino = Math.floor(Math.random() * CATEGORIAS.length);
    // gira varias vueltas y deja el centro del sector destino bajo la aguja (arriba), con algo de azar
    const dentro = (Math.random() - 0.5) * SEG * 0.7;
    const final = 360 - (destino * SEG + SEG / 2 + dentro);
    const actual = ((giro % 360) + 360) % 360;
    giro += (reducir ? 360 : 360 * 5) + ((final - actual + 360) % 360);
    rueda.style.transition = `transform ${reducir ? 0.4 : 4.6}s cubic-bezier(.12,.7,.1,1)`;
    rueda.style.transform = `rotate(${giro}deg)`;
    setTimeout(() => {
      const cat = CATEGORIAS[destino];
      const reto = elegirReto(cat);
      window.retoActual = { cat, reto };
      $('#reto-cat').textContent = cat;
      $('#reto-texto').textContent = reto;
      carta.hidden = false;
      girando = false;
      btnGirar.disabled = false;
      btnGirar.textContent = 'Otra vez';
    }, reducir ? 450 : 4700);
  }
  btnGirar.addEventListener('click', girar);
  $('#reto-otro').addEventListener('click', girar);
  // "Tomar foto del reto": misma cámara del álbum (album.js)
  $('#reto-foto').addEventListener('click', () => window.abrirCamara?.());
})();
