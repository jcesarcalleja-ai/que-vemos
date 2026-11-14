# ¿Qué vemos? — especificación

Web para móvil (PWA) que **decide por mí** qué peli o serie ver. Es la fuente de verdad del producto: si el código y este documento discrepan, manda este documento.

## El problema

Cada vez que entro en Netflix, Prime Video, Max o Movistar Plus+ me paso horas buscando y no encuentro nada. La app elige por mí.

**Regla de oro:** nada de cuestionarios, filtros ni botón "Otra". Si la app hace contestar preguntas, vuelve a ser como estar buscando. Toda elección acaba siempre en pocos toques.

## Para quién

Solo para mí y mi novia, en un mismo móvil. Sin cuentas ni contraseñas. Todo se guarda en el almacenamiento del navegador.

## Cómo se usa

1. **Al abrir ya hay una propuesta en pantalla**, sin preguntar nada: póster grande, título, año, duración, nota, una frase de sinopsis y en qué plataforma está.
   - Pelis: entre semana o a partir de las 23:00 tira hacia pelis de menos de 1h45 (105 min). Viernes y sábado le da igual.
   - Series: entre semana tira hacia miniseries o series cortas (1 temporada o menos de 10 episodios).
2. Arriba solo hay dos interruptores, que recuerdan cómo se dejaron: **Pelis / Series** y **Solo / Con mi novia**.
3. Botones de la propuesta: **Ver en [plataforma]**, **Tráiler**, **Ya la vi** y **Elegir yo**.
4. **Elegir yo** (si la propuesta no convence):
   - **Solo → Duelos**: torneo de 8 títulos elegidos según mis notas, enfrentados de dos en dos ("¿esta o esta?"): cuartos, semis y final. 7 toques y siempre hay ganadora.
   - **Con mi novia → Match**: la app saca 10 títulos. Primero los desliza ella (sí/no) y luego yo los mismos, en el mismo móvil. Gana el mejor con sí de los dos. Si no coincidimos en ninguno, la app elige entre los que alguno marcó con sí.
   - No existe botón "Otra": el título que gana es el que se ve.
5. **Ya la vi** está en cualquier carta (propuesta, Duelos y Match): pide nota del 1 al 10 y en su lugar aparece otro título.

## Cómo aprende los gustos

- **Nota del 1 al 10** pulsando un número. 7 o más enseña qué gusta; 4 o menos, qué evitar.
- **Al empezar**, cada uno hace un swipe de unos 20 títulos conocidos: nota del 1 al 10 o "no la he visto". Dos perfiles: el mío (`yo`) y el de mi novia (`ella`).
- Mi novia marca además una vez sus **"jamás"** (géneros vetados, por ejemplo terror o guerra); en modo pareja no se proponen.
- En el Match, lo que se desliza también afina el perfil de quien desliza.
- Nunca se propone algo ya visto o abandonado.
- **Series**: no se lleva la cuenta del capítulo. Solo "vista" (con nota) o "abandonada".

## Qué hay por detrás

- **Plataformas**: solo Netflix, Prime Video, Max y Movistar Plus+, disponibilidad en **España**.
- **Cómo elige**: con reglas (mis notas, nota general, género, duración). Sin IA.
- **Formato**: web para móvil instalable en la pantalla de inicio (PWA), publicada en GitHub Pages (repositorio `que-vemos`, cuenta `jcesarcalleja-ai`, servida bajo `/que-vemos/`).
- **Estilo**: fondo oscuro (se usa con la luz apagada en el sofá), pósters grandes, tipografía de títulos con aire de cine. Todo el texto de la interfaz en español.
- **Exportar e importar** las notas con un botón, porque los datos viven solo en un móvil.
- "Ver en [plataforma]" lleva como mínimo a la ficha o a la búsqueda del título en la plataforma; el enlace directo se intenta sin garantizarlo.

## Decisiones tomadas al implementar (suposiciones)

- **Entre semana** = noches de domingo a jueves. **Tarde** = de 23:00 a 05:00, cualquier día. Si es entre semana o es tarde, se prefiere lo corto; viernes y sábado antes de las 23:00 da igual. Es una preferencia que suma o resta puntos, no un filtro.
- **La propuesta es estable durante la misma noche**: abrir y cerrar la app no cambia el título (sería un botón "Otra" encubierto). Cambia al día siguiente o cuando ese título se marca como visto. Una "noche" va de 06:00 a 06:00. Dos excepciones aceptadas: viernes y sábado puede cambiar al dar las 23:00 (ahí empieza a preferir lo corto), y puede cambiar si entre medias se puntúan otros títulos o se juega un Match, porque los gustos han cambiado.
- **«Ya la vi» en el Match durante el turno de `yo`**: el título que entra no lo ha visto ella, así que cuenta como un «no» suyo; el móvil no vuelve a ella.
- **La propuesta varía de una noche a otra** aunque no se haya marcado nada: no repite el mismo título noche tras noche. La duración «tira hacia» lo corto, pero no hasta el punto de llenar la propuesta o los Duelos de títulos mediocres por ser cortos.
- **«Elegir yo» descarta la propuesta**: el título que no convenció no entra en esos Duelos ni en ese Match.
- **Modo pareja**: no se propone nada que haya visto o abandonado cualquiera de los dos, ni géneros "jamás" de ella. Los gustos de los dos cuentan.
- **Quién puntúa en "Ya la vi"**: en la propuesta y en Duelos, el perfil `yo`. En el Match, quien está deslizando en ese momento.
- **"Abandonada"** se ofrece dentro de "Ya la vi", solo en series, junto a los números del 1 al 10.
- **Swipe inicial**: el mío, la primera vez que se abre la app; el de ella y sus "jamás", la primera vez que se activa "Con mi novia". Mezcla pelis y series.
- **Match sin ningún sí**: gana el mejor puntuado de los 10.
- **Pantalla de la ganadora** (Duelos o Match): Ver, Tráiler y Ya la vi. No vuelve a ofrecer "Elegir yo".

## De dónde salen los datos

- La app no llama a ninguna API desde el móvil: lee un archivo `catalogo.json` publicado con la web.
- Un script (`scripts/`) prepara ese archivo: el catálogo, los pósters y la disponibilidad por plataforma salen de TMDB (que la toma de JustWatch), y la **nota es la de IMDb** (ficheros públicos de IMDb); si un título no tiene nota en IMDb, se usa la de TMDB.
- GitHub Actions regenera el catálogo y publica la web una vez al día. La clave de TMDB vive como secreto del repositorio (`TMDB_API_KEY`) y, en local, en `.env.local` (que no se sube).
- En España la plataforma «Max» vuelve a llamarse **HBO Max**; en el código es `max`.

## Arquitectura

- Vite + React + TypeScript, tests con Vitest. Sin backend.
- `src/tipos.ts`: contrato de datos compartido.
- `src/motor/`: reglas puras (puntuar, proponer, Duelos, Match). Sin React, sin almacenamiento, sin red.
- `src/estado/`: guardar y leer en el navegador, exportar e importar.
- `src/datos/`: de dónde salen los títulos (implementa `Catalogo`).
- `src/ui/`: componentes visuales y estilos.
- `src/App.tsx`: el flujo de pantallas.
