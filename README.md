demo: https://zoemata500-ops.github.io/Mirror/
# Espejo inteligente

Interfaz para un espejo inteligente que muestra la hora, el clima, una lista de tareas y un temporizador, y que además se controla con la voz. Incluye a **Miko**, una mascota animada que asoma detrás del reloj y que, cuando le hablas, pasa al frente de la pantalla.

<!-- Agrega aquí una captura o un GIF de la pantalla principal -->
<!-- ![Pantalla principal](./docs/pantalla-principal.png) -->

## Funcionalidades

- **Hora y fecha:** reloj de tarjetas con efecto de volteo (flip clock), con día de la semana, fecha y AM/PM.
- **Clima:** a partir de la ubicación, muestra la ciudad, la temperatura actual, el estado del cielo y la mínima y máxima del día. Los datos vienen de la API Open-Meteo.
- **Lista de tareas:** agregar, tachar y borrar tareas del día.
- **Temporizador:** se ajusta por minutos y segundos, con el mismo estilo de tarjetas. Avisa cuando llega a cero.
- **Control por voz:** todo lo anterior se puede manejar hablando, en español.
- **Miko:** mascota animada que parpadea, flota y asoma detrás del reloj. Al decir su nombre y "hablar", se acerca al centro mientras el resto de la interfaz baja y sale de la pantalla. Cuando el espejo habla, la boca de Miko se mueve según las vocales de cada palabra.
- **Modo descanso:** pantalla negra para cuando el espejo no se usa.

## Comandos de voz

Para empezar a escuchar se pulsa una tecla (`F2`, pensada para un botón físico en el espejo) o clic derecho. Ejemplos de lo que entiende:

| Quiero… | Puedo decir… |
|---|---|
| Hablar con Miko | "Quiero hablar con Polo" |
| Volver a la pantalla normal | "Adiós", "regresa", "vuelve" |
| Saber el clima | "¿Cómo está el clima?" |
| Saber la fecha | "¿Qué día es?" |
| Agregar una tarea | "Agrega la tarea comprar leche" |
| Tachar o borrar una tarea | "Tacha la tarea comprar leche" |
| Cerrar un panel | "Quita las tareas", "cierra el temporizador" |
| Iniciar un temporizador | "Temporizador de cinco minutos" |
| Parar el temporizador | "Para el temporizador" |
| Apagar la pantalla | Palabra de descanso, sola o en una frase corta |

## Por qué la palabra de activación es "Polo"

La mascota se llama Miko, pero el reconocimiento de voz del navegador no la entendía bien en español. "Miko" se transcribía como otras palabras, así que la palabra que activa el modo Miko se cambió a **Polo**, que el navegador reconoce con mucha más fiabilidad. La lista de palabras aceptadas está en la constante `NOMBRES` de `voz.js`, y se puede cambiar o ampliar en cualquier momento.

## Tecnologías

- **HTML, CSS y JavaScript** sin frameworks.
- **Web Speech API**, para reconocer la voz (`SpeechRecognition`) y para que el espejo hable (`SpeechSynthesis`). Funciona mejor en Google Chrome.
- **CSS moderno** para la animación de Miko: unidades `cqw` (container queries), la propiedad `translate` y transiciones, sin librerías de animación.
- **Node.js** en la carpeta `backend`. <!-- Explica en una línea qué hace tu servidor, por ejemplo: "sirve los datos del clima" -->
- **Open-Meteo**, una API del clima gratuita y sin llave, que da la temperatura, el estado del cielo y las mínimas y máximas a partir de las coordenadas de la ubicación.

## Clima y ubicación

El módulo del clima (`clima.js`) funciona en dos pasos:

1. **Ubicación:** obtiene la ubicación para saber de qué ciudad pedir el clima y mostrar su nombre en pantalla.
2. **Clima:** con esas coordenadas consulta la API **Open-Meteo** y muestra la temperatura, el estado del cielo y el rango del día.

Open-Meteo no necesita registro ni llave de acceso, lo que facilita que cualquiera pueda clonar y probar el proyecto. <!-- Si tu servidor interviene en esta consulta, agrégalo aquí -->

## Estructura del proyecto

```
Espejo_inteligente/
├── backend/
│   ├── servidor.js
│   └── package.json
└── frontend/
    ├── index.html
    ├── style.css            # estilos generales y reloj
    ├── time.js              # hora y fecha
    ├── clima.css / clima.js
    ├── tareas.css / tareas.js
    ├── temporizador.css / temporizador.js
    ├── voz.css / voz.js     # comandos de voz
    ├── miko.css / miko.js   # mascota y modo "hablar con Miko"
    └── miko-habla.css       # formas de la boca al hablar
```

## Cómo ejecutarlo

1. Clona el repositorio.
2. Instala y arranca el servidor:
   ```bash
   cd Espejo_inteligente/backend
   npm install
   node servidor.js
   ```
3. Abre `frontend/index.html` con un servidor local (por ejemplo, la extensión Live Server de VS Code) en **Google Chrome**.
4. Permite el acceso al micrófono cuando el navegador lo pida.

## Cómo funciona Miko

- **Detrás del reloj:** Miko y el reloj están en capas distintas con `z-index`. El reloj queda encima, por eso solo asoma la cabeza, y las manos quedan por delante del borde de las tarjetas.
- **Modo "hablar con Miko":** `miko.js` solo agrega o quita una clase en `<body>`. El CSS hace todo el movimiento con transiciones, así que al quitar la clase todo regresa solo a su lugar.
- **Boca al hablar:** mientras suena la voz, el evento `onboundary` avisa cuando empieza cada palabra. `miko.js` mira su primera vocal y cambia el atributo `data-boca` entre cuatro formas (cerrada, media, abierta y redonda), que `miko-habla.css` dibuja.
- **Cuidados con la voz:** si una frase interrumpe a otra, solo la última puede mover la boca. Además hay un temporizador de respaldo que la cierra si el navegador nunca avisa que terminó.

## Retos y aprendizajes

- Reconocimiento de voz en español: elegir una palabra de activación que el navegador entienda bien.
- Sincronizar de forma sencilla la boca de la mascota con la voz sintetizada, aunque no todas las voces avisen cada palabra.
- Animar con CSS capas, escalas y movimientos sin que choquen con los estilos de los demás componentes.

## Próximos pasos

- Escuchar todo el tiempo con una palabra de activación, sin pulsar ninguna tecla.
- Que Miko responda preguntas y no solo ejecute comandos.
- Más expresiones para Miko.

## Autor

<!-- Tu nombre, tu portafolio y tu LinkedIn -->
