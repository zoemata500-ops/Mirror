const IDIOMA = 'es-MX';   // idioma del reconocimiento y de la voz. Un solo idioma a la vez
const TECLA = 'F2';       // la tecla que manda tu botón físico. Cámbiala cuando lo tengas

// Chrome lo expone con prefijo; el || usa el que exista
const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
const reconocimiento = Reconocimiento ? new Reconocimiento() : null;  // null si el navegador no lo soporta

reconocimiento.lang = IDIOMA;        // OJO: si es null, esta línea falla; en Chrome no pasa
reconocimiento.interimResults = false;  // solo el resultado final
reconocimiento.continuous = false;      // escucha una frase y se detiene

let escuchando = false;     // evita llamar a start() dos veces
let textoEscuchado = '';    // se guarda en onresult y se usa en onend

// Elemento de texto que muestra lo que oyó (se crea desde JS)
const aviso = document.createElement('p');
aviso.className = 'voz-aviso';
document.body.append(aviso);

let pendienteBorrarAviso = null;
function mostrarAviso(texto) {
  aviso.textContent = texto;
  clearTimeout(pendienteBorrarAviso);                                 // cancela el borrado anterior
  pendienteBorrarAviso = setTimeout(() => { aviso.textContent = ''; }, 5000); // se borra a los 5 s
}

function hablar(texto) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();                       // calla cualquier lectura anterior
  const frase = new SpeechSynthesisUtterance(texto);
  frase.lang = IDIOMA;
  window.speechSynthesis.speak(frase);
}

function decirClima() {
  const temperatura = climaTemp.textContent.replace('°', '');   // "18°" -> "18"
  if (temperatura === '--') {                                    // clima.js aún no cargó datos
    hablar('Todavía no tengo los datos del clima');
    return;
  }
  const [minima, maxima] = climaRango.textContent
    .split('/')                                  // "6° / 21°" -> ["6° ", " 21°"]
    .map((t) => t.replace('°', '').trim());      // quita el símbolo y los espacios
  hablar(
    `En ${CIUDAD} hay ${temperatura} grados, ${climaEstado.textContent.toLowerCase()}. ` +
    `La mínima de hoy es ${minima} y la máxima ${maxima}.`
  );
}

function programarTemporizador(texto) {
  const coincidencia = texto.match(/(\d+)\s*(minuto|segundo)/);  // busca "5 minutos" o "30 segundos"
  if (coincidencia) {
    const cantidad = Number(coincidencia[1]);                    // el número (texto -> número)
    const total = coincidencia[2] === 'minuto' ? cantidad * 60 : cantidad;
    ajustarDuracion(total);
  }
  abrirTemporizador();   // muestra el panel
  iniciar();             // arranca con la duración que haya
}

function dijoAlguna(texto, palabras) {
  return palabras.some((palabra) => texto.includes(palabra));    // ¿aparece alguna del arreglo?
}

const CERRAR = ['cierra', 'cerrar', 'oculta', 'esconde', 'quita'];

// Arreglo de comandos. El orden importa: se usa el primero que coincida
const comandos = [
  { coincide: (t) => dijoAlguna(t, CERRAR) && t.includes('tarea'),
    accion: () => cerrarTareas() },

  { coincide: (t) => dijoAlguna(t, CERRAR) && t.includes('temporizador'),
    accion: () => cerrarTemporizador() },

  { coincide: (t) => dijoAlguna(t, ['deten', 'pausa']) && t.includes('temporizador'),
    accion: () => detener() },

  { coincide: (t) => t.includes('reinicia') && t.includes('temporizador'),
    accion: () => reiniciar() },

  { coincide: (t) => t.includes('temporizador'),     // el más general de los temporizadores, va al final
    accion: (t) => programarTemporizador(t) },

  { coincide: (t) => dijoAlguna(t, ['clima', 'temperatura']),
    accion: () => decirClima() },

  { coincide: (t) => t.includes('tarea'),
    accion: () => { abrirTareas(); hablar('Estas son tus tareas'); } }
];

function procesar(textoOriginal) {
  const texto = textoOriginal
    .toLowerCase()
    .normalize('NFD')                    // separa las letras de sus acentos
    .replace(/[\u0300-\u036f]/g, '');    // borra los acentos: "muéstrame" -> "muestrame"
  const comando = comandos.find((c) => c.coincide(texto));  // primer comando que coincide
  if (!comando) {
    hablar('No entendí');
    return;
  }
  comando.accion(texto);
}

function escuchar() {
  if (!reconocimiento) {
    mostrarAviso('Este navegador no soporta reconocimiento de voz');
    return;
  }
  if (escuchando) return;
  escuchando = true;
  window.speechSynthesis.cancel();   // si estaba hablando, se calla para no escucharse
  reconocimiento.start();
}

reconocimiento.onstart = () => {
  textoEscuchado = '';
  mostrarAviso('Escuchando…');
};

reconocimiento.onresult = (evento) => {
  textoEscuchado = evento.results[0][0].transcript;   // primera frase, primera alternativa
  mostrarAviso(`"${textoEscuchado}"`);
};

reconocimiento.onerror = (evento) => {
  mostrarAviso('Error: ' + evento.error);             // not-allowed, no-speech, network...
};

reconocimiento.onend = () => {
  escuchando = false;
  if (textoEscuchado) {
    procesar(textoEscuchado);   // se ejecuta DESPUÉS de cerrar el micrófono, así no se oye a sí mismo
  }
};


document.addEventListener('contextmenu', (evento) => {
  evento.preventDefault();   // evita que salga el menú del clic derecho
  escuchar();                // la misma función que usa la tecla
});