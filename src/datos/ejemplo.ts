// Catálogo de ejemplo con datos fijos, para desarrollar y probar sin red.
// Títulos reales; la disponibilidad por plataforma y los enlaces son orientativos (no se han comprobado).
// Sin pósters a propósito (`poster: null`): no se inventan URL.

import type { Catalogo, Ficha, Genero, Plataforma, Tipo, Titulo } from '../tipos';

const BUSQUEDA: Record<Plataforma, (q: string) => string> = {
  netflix: (q) => `https://www.netflix.com/search?q=${q}`,
  prime: (q) => `https://www.primevideo.com/search/?phrase=${q}`,
  max: (q) => `https://play.max.com/search?q=${q}`,
  movistar: (q) => `https://ver.movistarplus.es/buscador/?q=${q}`,
};

const N: Plataforma = 'netflix';
const P: Plataforma = 'prime';
const M: Plataforma = 'max';
const V: Plataforma = 'movistar';

/** id, título, año, géneros, nota, plataforma, minutos, sinopsis, ¿con tráiler? */
type FilaPeli = [string, string, number, Genero[], number, Plataforma, number, string, boolean];
/** id, título, año, géneros, nota, plataforma, temporadas, episodios, sinopsis, ¿con tráiler? */
type FilaSerie = [string, string, number, Genero[], number, Plataforma, number, number, string, boolean];

const PELIS: FilaPeli[] = [
  // Cortas (menos de 105 min)
  ['toy-story', 'Toy Story', 1995, ['Animación', 'Aventura', 'Familia', 'Comedia'], 8.3, P, 81, 'Los juguetes de Andy cobran vida cuando nadie mira, hasta que llega un nuevo juguete que amenaza con quitarle el puesto a Woody.', true],
  ['shrek', 'Shrek', 2001, ['Animación', 'Comedia', 'Fantasía', 'Familia'], 7.9, P, 90, 'Un ogro gruñón recibe el encargo de rescatar a una princesa para recuperar su pantano.', true],
  ['buscando-a-nemo', 'Buscando a Nemo', 2003, ['Animación', 'Aventura', 'Familia', 'Comedia'], 8.2, P, 100, 'Un pez payaso muy protector cruza el océano para encontrar a su hijo, capturado por un buceador.', true],
  ['del-reves', 'Del revés', 2015, ['Animación', 'Comedia', 'Familia', 'Aventura'], 8.1, P, 95, 'Las emociones de una niña se desbordan dentro de su cabeza cuando su familia se muda de ciudad.', true],
  ['mi-vecino-totoro', 'Mi vecino Totoro', 1988, ['Animación', 'Familia', 'Fantasía'], 8.1, N, 86, 'Dos hermanas se mudan al campo y descubren un espíritu del bosque enorme y peludo.', true],
  ['zombieland', 'Zombieland', 2009, ['Comedia', 'Terror', 'Acción'], 7.5, N, 88, 'Un joven miedoso sobrevive al apocalipsis zombi siguiendo sus propias reglas, junto a un cuarteto muy dispar.', true],
  ['zombies-party', 'Zombies Party', 2004, ['Comedia', 'Terror'], 7.9, V, 99, 'Un dependiente sin rumbo se ve obligado a salvar a su novia y a su madre cuando su barrio se llena de zombis.', true],
  ['los-otros', 'Los otros', 2001, ['Terror', 'Misterio', 'Suspense'], 7.6, M, 101, 'Una madre protege a sus hijos, alérgicos a la luz, en una mansión aislada donde empiezan a pasar cosas inexplicables.', true],
  ['un-lugar-tranquilo', 'Un lugar tranquilo', 2018, ['Terror', 'Suspense', 'Ciencia ficción'], 7.5, P, 90, 'Una familia vive en silencio absoluto porque unas criaturas cazan guiándose por el sonido.', true],
  ['cuando-harry-encontro-a-sally', 'Cuando Harry encontró a Sally', 1989, ['Romance', 'Comedia'], 7.6, M, 96, '¿Pueden un hombre y una mujer ser solo amigos? Años de encuentros y desencuentros para averiguarlo.', true],
  ['trainspotting', 'Trainspotting', 1996, ['Drama', 'Comedia', 'Crimen'], 8.1, V, 94, 'Un grupo de jóvenes de Edimburgo malvive entre la heroína, el humor negro y las ganas de escapar.', true],
  ['ocho-apellidos-vascos', 'Ocho apellidos vascos', 2014, ['Comedia', 'Romance'], 6.5, N, 98, 'Un andaluz se hace pasar por vasco de pura cepa para conquistar a una chica de un pueblo de Guipúzcoa.', true],
  ['hombres-de-negro', 'Hombres de negro', 1997, ['Ciencia ficción', 'Comedia', 'Acción', 'Aventura'], 7.3, P, 98, 'Una agencia secreta vigila a los extraterrestres que viven entre nosotros, y necesita un nuevo agente.', true],
  ['casablanca', 'Casablanca', 1942, ['Romance', 'Drama', 'Bélica'], 8.5, M, 102, 'En el Marruecos de la guerra, un dueño de bar debe elegir entre el amor y hacer lo correcto.', true],
  ['cuenta-conmigo', 'Cuenta conmigo', 1986, ['Drama', 'Aventura'], 8.1, V, 89, 'Cuatro amigos de doce años caminan dos días para ver un cadáver, y dejan atrás la infancia.', false],
  ['free-solo', 'Free Solo', 2018, ['Documental', 'Aventura'], 8.1, N, 100, 'Alex Honnold intenta escalar sin cuerdas los novecientos metros de El Capitán.', true],
  ['mi-maestro-el-pulpo', 'Mi maestro el pulpo', 2020, ['Documental', 'Familia'], 8.1, N, 85, 'Un cineasta agotado entabla una amistad improbable con un pulpo salvaje durante un año de inmersiones.', true],
  ['la-vida-de-brian', 'La vida de Brian', 1979, ['Comedia'], 8.0, V, 94, 'Un joven nacido el mismo día que Jesús es confundido con el Mesías en la Judea romana.', false],
  // De 105 a 130 min
  ['whiplash', 'Whiplash', 2014, ['Drama', 'Música'], 8.5, P, 107, 'Un joven batería de jazz se enfrenta a un profesor tan brillante como despiadado.', true],
  ['coco', 'Coco', 2017, ['Animación', 'Familia', 'Fantasía', 'Música', 'Aventura'], 8.4, P, 105, 'Un niño que sueña con ser músico viaja a la Tierra de los Muertos el Día de Muertos.', true],
  ['intocable', 'Intocable', 2011, ['Comedia', 'Drama'], 8.5, N, 112, 'Un aristócrata tetrapléjico contrata como cuidador a un joven de los suburbios y nace una gran amistad.', true],
  ['kill-bill-1', 'Kill Bill: Volumen 1', 2003, ['Acción', 'Crimen'], 8.2, N, 111, 'Una asesina despierta de un coma y emprende una venganza contra quienes la traicionaron.', true],
  ['regreso-al-futuro', 'Regreso al futuro', 1985, ['Ciencia ficción', 'Aventura', 'Comedia'], 8.5, N, 116, 'Marty McFly viaja a 1955 en un DeLorean y debe asegurarse de que sus padres se enamoren.', true],
  ['spiderman-nuevo-universo', 'Spider-Man: Un nuevo universo', 2018, ['Animación', 'Acción', 'Aventura', 'Ciencia ficción'], 8.4, N, 117, 'Miles Morales descubre que no es el único Spider-Man cuando varios universos chocan en Nueva York.', true],
  ['celda-211', 'Celda 211', 2009, ['Crimen', 'Drama', 'Suspense', 'Acción'], 7.6, V, 113, 'Un funcionario de prisiones atrapado durante un motín tiene que hacerse pasar por un preso.', true],
  ['mamma-mia', 'Mamma Mia!', 2008, ['Comedia', 'Música', 'Romance'], 6.5, P, 108, 'Una novia griega invita a tres posibles padres a su boda, al ritmo de las canciones de ABBA.', true],
  ['1917', '1917', 2019, ['Bélica', 'Drama', 'Historia'], 8.2, P, 119, 'Dos soldados británicos cruzan territorio enemigo para entregar un mensaje que puede salvar a 1.600 hombres.', true],
  ['knives-out', 'Puñales por la espalda', 2019, ['Misterio', 'Comedia', 'Crimen'], 7.9, P, 130, 'Un detective investiga la muerte de un patriarca millonario rodeado de una familia llena de secretos.', true],
  ['la-la-land', 'La La Land', 2016, ['Romance', 'Música', 'Comedia', 'Drama'], 8.0, N, 128, 'Un pianista de jazz y una aspirante a actriz se enamoran en Los Ángeles mientras persiguen sus sueños.', true],
  ['parasitos', 'Parásitos', 2019, ['Drama', 'Suspense', 'Comedia'], 8.5, M, 132, 'Una familia sin recursos se va infiltrando, uno a uno, en la casa de una familia adinerada.', true],
  ['joker', 'Joker', 2019, ['Drama', 'Crimen', 'Suspense'], 8.4, M, 122, 'Un cómico fracasado de Gotham se hunde en la locura hasta convertirse en un símbolo del caos.', true],
  ['tiburon', 'Tiburón', 1975, ['Suspense', 'Aventura', 'Terror'], 8.1, V, 124, 'Un jefe de policía, un biólogo y un viejo pescador salen al mar a cazar un tiburón blanco que aterroriza una playa.', true],
  // Largas (más de 130 min)
  ['el-resplandor', 'El resplandor', 1980, ['Terror', 'Misterio'], 8.4, M, 146, 'Un escritor y su familia pasan el invierno cuidando un hotel aislado que le va trastornando poco a poco.', true],
  ['forrest-gump', 'Forrest Gump', 1994, ['Drama', 'Romance', 'Comedia'], 8.8, P, 142, 'Un hombre de buen corazón y pocas luces atraviesa medio siglo de historia de Estados Unidos.', true],
  ['origen', 'Origen', 2010, ['Ciencia ficción', 'Acción', 'Suspense'], 8.8, M, 148, 'Un ladrón especializado en robar secretos de los sueños recibe el encargo de implantar una idea.', true],
  ['pulp-fiction', 'Pulp Fiction', 1994, ['Crimen', 'Drama', 'Suspense'], 8.9, V, 154, 'Dos sicarios, un boxeador, la mujer de un gánster y un atraco, contados en desorden.', true],
  ['gladiator', 'Gladiator', 2000, ['Acción', 'Drama', 'Historia', 'Aventura'], 8.5, P, 155, 'Un general romano traicionado se convierte en gladiador para vengar a su familia.', true],
  ['dune', 'Dune', 2021, ['Ciencia ficción', 'Aventura', 'Drama'], 8.0, M, 155, 'El joven Paul Atreides viaja al planeta desértico Arrakis, la única fuente de la sustancia más valiosa del universo.', true],
  ['el-bueno-el-feo-y-el-malo', 'El bueno, el feo y el malo', 1966, ['Western', 'Aventura'], 8.8, V, 161, 'Tres pistoleros se disputan, en plena Guerra Civil, un tesoro enterrado en un cementerio.', false],
  ['interstellar', 'Interstellar', 2014, ['Ciencia ficción', 'Aventura', 'Drama'], 8.7, M, 169, 'Con la Tierra agonizando, un grupo de astronautas atraviesa un agujero de gusano en busca de un nuevo hogar.', true],
  ['el-senor-de-los-anillos-1', 'El Señor de los Anillos: La Comunidad del Anillo', 2001, ['Aventura', 'Fantasía', 'Acción'], 8.9, M, 178, 'Un hobbit hereda un anillo todopoderoso y una compañía de nueve emprende el viaje para destruirlo.', true],
  ['oppenheimer', 'Oppenheimer', 2023, ['Drama', 'Historia', 'Suspense'], 8.3, P, 180, 'La historia del físico que dirigió el Proyecto Manhattan y construyó la primera bomba atómica.', true],
  ['la-lista-de-schindler', 'La lista de Schindler', 1993, ['Drama', 'Historia', 'Bélica'], 9.0, M, 195, 'Un empresario alemán salva a más de mil judíos empleándolos en sus fábricas durante el Holocausto.', true],
  ['titanic', 'Titanic', 1997, ['Romance', 'Drama'], 7.9, P, 195, 'Un joven artista y una chica de clase alta se enamoran a bordo del barco que no podía hundirse.', true],
  ['bohemian-rhapsody', 'Bohemian Rhapsody', 2018, ['Música', 'Drama'], 7.9, N, 134, 'El ascenso de Queen y de Freddie Mercury, desde sus inicios hasta el concierto del Live Aid.', true],
  ['cadena-perpetua', 'Cadena perpetua', 1994, ['Drama', 'Crimen'], 9.3, N, 142, 'Un banquero condenado por un crimen que no cometió sobrevive a décadas de prisión sin perder la esperanza.', true],
];

const SERIES: FilaSerie[] = [
  // Miniseries y series cortas (1 temporada o menos de 10 episodios)
  ['chernobyl', 'Chernobyl', 2019, ['Drama', 'Historia'], 9.3, M, 1, 5, 'La catástrofe nuclear de 1986 y el empeño de quienes intentaron contenerla, mientras el Estado ocultaba la verdad.', true],
  ['gambito-de-dama', 'Gambito de dama', 2020, ['Drama'], 8.5, N, 1, 7, 'Una huérfana prodigio del ajedrez lucha contra sus adicciones en su camino hacia la cima mundial.', true],
  ['bebe-reno', 'Bebé reno', 2024, ['Drama', 'Suspense'], 7.7, N, 1, 7, 'Un cómico fracasado es acosado sin descanso por una mujer a la que invitó a un té.', true],
  ['adolescencia', 'Adolescencia', 2025, ['Crimen', 'Drama'], 8.1, N, 1, 4, 'Un chico de trece años es detenido por un asesinato y su familia intenta entender qué ha pasado.', true],
  ['mare-of-easttown', 'Mare of Easttown', 2021, ['Crimen', 'Misterio', 'Drama'], 8.4, M, 1, 7, 'Una detective de un pueblo de Pensilvania investiga un asesinato mientras su propia vida se desmorona.', true],
  ['hermanos-de-sangre', 'Hermanos de sangre', 2001, ['Bélica', 'Drama', 'Historia'], 9.4, M, 1, 10, 'El recorrido de la Compañía Easy, de la instrucción al final de la Segunda Guerra Mundial.', true],
  ['nuestro-planeta', 'Nuestro planeta', 2019, ['Documental'], 9.3, N, 1, 8, 'Un viaje por los ecosistemas más espectaculares de la Tierra y por lo que les está pasando.', true],
  ['antidisturbios', 'Antidisturbios', 2020, ['Crimen', 'Drama', 'Suspense'], 7.8, V, 1, 6, 'Seis policías antidisturbios se enfrentan a las consecuencias de un desahucio que acaba en tragedia.', true],
  ['patria', 'Patria', 2020, ['Drama', 'Historia'], 7.7, M, 1, 8, 'Dos familias vascas, antes amigas, quedan rotas por el terrorismo de ETA.', true],
  ['fleabag', 'Fleabag', 2016, ['Comedia', 'Drama'], 8.7, P, 2, 12, 'Una joven londinense, bocazas y desastre sentimental, habla directamente a cámara de su vida.', true],
  ['sherlock', 'Sherlock', 2010, ['Crimen', 'Misterio', 'Drama'], 9.1, V, 4, 13, 'El detective más famoso de Londres, trasladado al siglo XXI junto a su fiel doctor Watson.', true],
  ['lupin', 'Lupin', 2021, ['Misterio', 'Crimen', 'Acción'], 7.5, N, 3, 17, 'Un ladrón con aspecto de caballero prepara un plan de venganza inspirado en el personaje de las novelas.', true],
  // Series de duración media
  ['black-mirror', 'Black Mirror', 2011, ['Ciencia ficción', 'Drama', 'Suspense'], 8.7, N, 7, 33, 'Historias independientes sobre cómo la tecnología puede torcer lo mejor y lo peor de nosotros.', true],
  ['dark', 'Dark', 2017, ['Ciencia ficción', 'Misterio', 'Drama'], 8.7, N, 3, 26, 'La desaparición de un niño en un pueblo alemán destapa un laberinto de viajes en el tiempo.', true],
  ['the-last-of-us', 'The Last of Us', 2023, ['Drama', 'Terror', 'Ciencia ficción', 'Aventura'], 8.7, M, 2, 16, 'Un superviviente endurecido escolta a una adolescente a través de unos Estados Unidos devastados por una pandemia.', true],
  ['fallout', 'Fallout', 2024, ['Ciencia ficción', 'Acción', 'Aventura'], 8.3, P, 2, 16, 'Una joven del refugio 33 sale a la superficie de un mundo posnuclear, absurdo y peligroso.', true],
  ['reacher', 'Reacher', 2022, ['Acción', 'Crimen', 'Suspense'], 8.1, P, 3, 24, 'Un ex policía militar de fuerza descomunal se mete en problemas allá donde para.', true],
  ['wednesday', 'Miércoles', 2022, ['Fantasía', 'Comedia', 'Misterio', 'Familia'], 8.1, N, 2, 16, 'Miércoles Addams llega a un colegio para marginados y se pone a resolver una serie de asesinatos.', true],
  ['arcane', 'Arcane', 2021, ['Animación', 'Fantasía', 'Acción', 'Ciencia ficción'], 9.0, N, 2, 18, 'Dos hermanas de los bajos fondos acaban en bandos opuestos de un conflicto entre dos ciudades.', true],
  ['the-boys', 'The Boys', 2019, ['Acción', 'Ciencia ficción', 'Comedia'], 8.7, P, 4, 32, 'Un grupo de vigilantes se enfrenta a superhéroes corruptos protegidos por una multinacional.', true],
  ['fargo', 'Fargo', 2014, ['Crimen', 'Drama', 'Comedia'], 8.9, V, 5, 51, 'Crímenes y gente corriente en el Medio Oeste helado, con humor negro y un estilo inconfundible.', false],
  ['bridgerton', 'Los Bridgerton', 2020, ['Romance', 'Drama', 'Historia'], 7.3, N, 3, 24, 'Las familias de la alta sociedad londinense compiten por el amor y el matrimonio en la Regencia.', true],
  // Largas
  ['stranger-things', 'Stranger Things', 2016, ['Ciencia ficción', 'Terror', 'Misterio', 'Drama'], 8.7, N, 5, 42, 'Un grupo de amigos se enfrenta a fuerzas sobrenaturales y a experimentos secretos en un pueblo de los años 80.', true],
  ['breaking-bad', 'Breaking Bad', 2008, ['Drama', 'Crimen', 'Suspense'], 9.5, N, 5, 62, 'Un profesor de química con cáncer empieza a fabricar metanfetamina para asegurar el futuro de su familia.', true],
  ['better-call-saul', 'Better Call Saul', 2015, ['Crimen', 'Drama'], 9.0, N, 6, 63, 'Antes de ser Saul Goodman, Jimmy McGill era un abogado de poca monta que se resistía a convertirse en lo que acabó siendo.', true],
  ['juego-de-tronos', 'Juego de tronos', 2011, ['Fantasía', 'Drama', 'Aventura', 'Acción'], 9.2, M, 8, 73, 'Familias nobles se disputan el Trono de Hierro mientras una amenaza antigua despierta en el norte.', true],
  ['succession', 'Succession', 2018, ['Drama', 'Comedia'], 8.8, M, 4, 39, 'Los hijos de un magnate de los medios luchan por heredar el imperio mientras él se resiste a retirarse.', true],
  ['los-soprano', 'Los Soprano', 1999, ['Crimen', 'Drama'], 9.2, M, 6, 86, 'Un jefe de la mafia de Nueva Jersey va a terapia por culpa de sus ataques de ansiedad.', true],
  ['the-wire', 'The Wire', 2002, ['Crimen', 'Drama'], 9.3, M, 5, 60, 'Policías, traficantes, políticos y periodistas de Baltimore, vistos desde todos los lados.', true],
  ['peaky-blinders', 'Peaky Blinders', 2013, ['Crimen', 'Drama', 'Historia'], 8.7, N, 6, 36, 'Una banda de gánsters de Birmingham tras la Primera Guerra Mundial, capitaneada por Tommy Shelby.', true],
  ['the-crown', 'The Crown', 2016, ['Drama', 'Historia'], 8.6, N, 6, 60, 'El reinado de Isabel II, de su juventud a las crisis del siglo XXI.', true],
  ['friends', 'Friends', 1994, ['Comedia', 'Romance'], 8.9, M, 10, 236, 'Seis amigos entre la veintena y la treintena, un café y un Nueva York que ya no existe.', true],
  ['the-office', 'The Office', 2005, ['Comedia'], 9.0, P, 9, 201, 'El día a día de los empleados de una oficina de papel en Scranton, grabado como un falso documental.', true],
  ['avatar-aang', 'Avatar: la leyenda de Aang', 2005, ['Animación', 'Aventura', 'Fantasía', 'Familia'], 9.3, N, 3, 61, 'Un niño de doce años, último maestro del aire, debe dominar los cuatro elementos y detener a la Nación del Fuego.', true],
];

function enlaceYoutube(titulo: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${titulo} tráiler oficial`)}`;
}

function enlace(plataforma: Plataforma, titulo: string): string {
  return BUSQUEDA[plataforma](encodeURIComponent(titulo));
}

function peli([id, titulo, anio, generos, nota, plataforma, duracionMin, sinopsis, conTrailer]: FilaPeli): Titulo {
  return {
    id: `peli-${id}`,
    tipo: 'peli',
    titulo,
    anio,
    poster: null,
    generos,
    nota,
    sinopsis,
    plataforma,
    enlace: enlace(plataforma, titulo),
    trailer: conTrailer ? enlaceYoutube(`${titulo} ${anio}`) : null,
    duracionMin,
  };
}

function serie([id, titulo, anio, generos, nota, plataforma, temporadas, episodios, sinopsis, conTrailer]: FilaSerie): Titulo {
  return {
    id: `serie-${id}`,
    tipo: 'serie',
    titulo,
    anio,
    poster: null,
    generos,
    nota,
    sinopsis,
    plataforma,
    enlace: enlace(plataforma, titulo),
    trailer: conTrailer ? enlaceYoutube(`${titulo} serie`) : null,
    temporadas,
    episodios,
  };
}

const TITULOS: Record<Tipo, Titulo[]> = {
  peli: PELIS.map(peli),
  serie: SERIES.map(serie),
};

// Muy conocidos, pelis y series alternadas, para el swipe inicial.
const CONOCIDOS = [
  'peli-titanic',
  'serie-friends',
  'peli-forrest-gump',
  'serie-breaking-bad',
  'peli-toy-story',
  'serie-juego-de-tronos',
  'peli-pulp-fiction',
  'serie-stranger-things',
  'peli-origen',
  'serie-the-office',
  'peli-joker',
  'serie-black-mirror',
  'peli-shrek',
  'serie-chernobyl',
  'peli-interstellar',
  'serie-gambito-de-dama',
  'peli-regreso-al-futuro',
  'serie-los-soprano',
  'peli-parasitos',
  'serie-peaky-blinders',
];

function ficha({ id, tipo, titulo, anio, poster, generos }: Titulo): Ficha {
  return { id, tipo, titulo, anio, poster, generos };
}

export const catalogoEjemplo: Catalogo = {
  async disponibles(tipo) {
    return TITULOS[tipo].map((t) => ({ ...t }));
  },
  async conocidos() {
    const todos = [...TITULOS.peli, ...TITULOS.serie];
    return CONOCIDOS.map((id) => {
      const t = todos.find((x) => x.id === id);
      if (!t) throw new Error(`Título conocido que no está en el catálogo: ${id}`);
      return ficha(t);
    });
  },
};
