const IDIOMA = 'es-MX';   // idioma del reconocimiento y de la voz. Un solo idioma a la vez
const NOMBRES = ['rico', 'memo', 'reico', 'pablo'];   // la palabra que activa a Miko por voz. Cámbiala aquí si hace falta
const TECLA = 'F2';       // la tecla que manda tu botón físico. Cámbiala cuando lo tengas

// Chrome lo expone con prefijo; el || usa el que exista
const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
const reconocimiento = Reconocimiento ? new Reconocimiento() : null;  // null si el navegador no lo soporta

if (reconocimiento) {                    // solo se configura si existe: así no se rompe en Firefox o Safari
  reconocimiento.lang = IDIOMA;
  reconocimiento.interimResults = false;  // solo el resultado final
  reconocimiento.continuous = false;      // escucha una frase y se detiene
}

let escuchando = false;     // evita llamar a start() dos veces
let dormido = false;        // true = pantalla negra
let textoEscuchado = '';    // se guarda en onresult y se usa en onend

// Elemento de texto que muestra lo que oyó (se crea desde JS)
const aviso = document.createElement('p');
aviso.className = 'voz-aviso';
document.body.append(aviso);

// Cortina negra del modo descanso (se crea desde JS, el estilo está en voz.css)
const cortina = document.createElement('div');
cortina.className = 'cortina';
document.body.append(cortina);

let pendienteBorrarAviso = null;
function mostrarAviso(texto) {
  aviso.textContent = texto;
  clearTimeout(pendienteBorrarAviso);                                 // cancela el borrado anterior
  pendienteBorrarAviso = setTimeout(() => { aviso.textContent = ''; }, 5000); // se borra a los 5 s
}

let fraseActual = null;     // la ÚLTIMA frase pedida: solo ella puede mover la boca de Miko
let respaldoBoca = null;    // temporizador de seguridad por si "onend" nunca llega

function hablar(texto) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();                       // calla cualquier lectura anterior
  const frase = new SpeechSynthesisUtterance(texto);
  frase.lang = IDIOMA;

  // Trampa 1: cancel() hace que la frase ANTERIOR dispare onend/onerror un instante después de que
  // empieza la nueva, y eso cerraría la boca a media frase. Por eso cada evento revisa
  // si su frase sigue siendo la actual; si no, se ignora.
  fraseActual = frase;
  clearTimeout(respaldoBoca);

  frase.onstart = () => {
    if (frase !== fraseActual) return;
    moverBoca(texto.split(' ')[0]);                      // arranca con la primera palabra
  };

  // onboundary avisa cada vez que empieza una palabra (no todas las voces lo hacen)
  frase.onboundary = (evento) => {
    if (frase !== fraseActual) return;
    if (evento.name && evento.name !== 'word') return;   // solo palabras, no oraciones
    moverBoca(texto.slice(evento.charIndex).split(/\s/)[0]);
  };

  frase.onend = frase.onerror = () => {
    if (frase !== fraseActual) return;
    clearTimeout(respaldoBoca);
    cerrarBoca();
  };

  // Trampa 2: a veces el navegador nunca manda onend. Si pasa el tiempo estimado
  // (1.5 s + 0.1 s por letra) y esta sigue siendo la frase actual, se cierra la boca a la fuerza.
  respaldoBoca = setTimeout(() => {
    if (frase === fraseActual) cerrarBoca();
  }, 1500 + texto.length * 100);

  window.speechSynthesis.speak(frase);
}

// Si el equipo no tiene ninguna voz en español, lo dice en la consola (F12)
function avisarSiFaltaVoz() {
  const hayEspanol = window.speechSynthesis.getVoices().some((voz) => voz.lang.startsWith('es'));
  if (!hayEspanol) {
    console.warn('No hay ninguna voz en español instalada: el espejo hablará con otra voz o no hablará.');
  }
}

if ('speechSynthesis' in window) {
  // Chrome carga las voces con retraso: este evento avisa cuando ya están
  window.speechSynthesis.addEventListener('voiceschanged', avisarSiFaltaVoz);
}

// ---------- Utilidades de texto ----------

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')                    // separa las letras de sus acentos
    .replace(/[\u0300-\u036f]/g, '');    // borra los acentos: "muéstrame" -> "muestrame"
}

// ¿aparece alguna de estas raíces EN CUALQUIER PARTE del texto? ("deten" encuentra "detener")
function dijoAlguna(texto, palabras) {
  return palabras.some((palabra) => texto.includes(palabra));
}

// ¿aparece alguna de estas PALABRAS COMPLETAS? ("inicia" NO encuentra "reinicia")
function dijoPalabra(texto, palabras) {
  return new RegExp('\\b(' + palabras.join('|') + ')\\b').test(texto);
}

// ---------- Números dichos con palabras ----------

const NUMEROS = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  veinte: 20, veinticinco: 25, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60
};
const DECENAS = { veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50 };

// "cuarenta y cinco" -> "45", "cinco" -> "5". Solo para leer duraciones y números de tarea
function palabrasANumeros(texto) {
  return texto
    .replace(/\b(veinte|treinta|cuarenta|cincuenta) y (uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/g,
      (_, decena, unidad) => String(DECENAS[decena] + NUMEROS[unidad]))
    .replace(/\b[a-z]+\b/g, (palabra) => (Object.hasOwn(NUMEROS, palabra) ? String(NUMEROS[palabra]) : palabra));
}

// Suma todas las unidades que encuentre: "2 minutos 30 segundos", "un minuto y medio", "media hora".
// Devuelve los segundos, o null si no encontró ninguna duración.
function extraerSegundos(texto) {
  const t = palabrasANumeros(texto);
  let total = 0;
  let encontrado = false;

  for (const coincidencia of t.matchAll(/(\d+)\s*(hora|minuto|segundo)/g)) {
    const cantidad = Number(coincidencia[1]);
    if (coincidencia[2] === 'hora') total += cantidad * 3600;
    else if (coincidencia[2] === 'minuto') total += cantidad * 60;
    else total += cantidad;
    encontrado = true;
  }

  if (/\bmedia hora\b/.test(t)) { total += 1800; encontrado = true; }
  if (/\bmedio minuto\b/.test(t)) { total += 30; encontrado = true; }
  if (/\bhoras? y media\b/.test(t)) total += 1800;
  if (/\bminutos? y medio\b/.test(t)) total += 30;

  return encontrado ? total : null;
}

// ---------- Respuestas habladas ----------

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

function decirHora() {
  const ahora = new Date();
  const hora24 = ahora.getHours();
  const hora12 = hora24 % 12 || 12;
  const minutos = ahora.getMinutes();

  let momento = 'de la noche';
  if (hora24 < 6) momento = 'de la madrugada';
  else if (hora24 < 12) momento = 'de la mañana';
  else if (hora24 === 12) momento = 'del día';
  else if (hora24 < 19) momento = 'de la tarde';

  const inicio = hora12 === 1 ? 'Es la una' : `Son las ${hora12}`;
  let resto = ` y ${minutos}`;
  if (minutos === 0) resto = ' en punto';
  else if (minutos === 15) resto = ' y cuarto';
  else if (minutos === 30) resto = ' y media';

  hablar(`${inicio}${resto} ${momento}`);
}

function decirFecha() {
  const fecha = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  hablar(`Hoy es ${fecha}`);
}

// ---------- Temporizador por voz ----------

function programarTemporizador(texto) {
  const segundos = extraerSegundos(texto);
  const mencionaUnidad = /\b(hora|horas|minuto|minutos|segundo|segundos)\b/.test(texto);

  if (segundos === null && mencionaUnidad) {   // dijo "minutos" pero no se entendió el número
    hablar('No entendí la duración');
    return;
  }

  if (segundos !== null) {
    if (segundos === 0) {
      hablar('La duración debe ser mayor que cero');
      return;
    }
    const aplicada = ajustarDuracion(segundos);
    if (aplicada < segundos) {
      hablar(`El máximo son ${Math.floor(DURACION_MAXIMA / 60)} minutos`);
    }
  }

  abrirTemporizador();   // muestra el panel
  iniciar();             // arranca con la duración que haya
}

// ---------- Tareas por voz ----------

const ORDINALES = {
  primer: 1, primera: 1, primero: 1, segunda: 2, segundo: 2, tercer: 3, tercera: 3, tercero: 3,
  cuarta: 4, cuarto: 4, quinta: 5, quinto: 5
};

// Del texto original (con acentos y mayúsculas) saca lo que viene después de "tarea"
function agregarPorVoz(textoOriginal) {
  const coincidencia = textoOriginal.match(/\btareas?\b\s*[:,]?\s*(?:que\s+(?:diga|dice)\s+|de\s+|para\s+)?(.+)$/i);
  const texto = coincidencia ? coincidencia[1].replace(/[.,;!?]+$/, '').trim() : '';

  if (texto === '') {
    hablar('Dime la tarea completa, por ejemplo: agrega la tarea comprar leche');
    return;
  }

  const resultado = agregarTarea(texto.charAt(0).toUpperCase() + texto.slice(1));

  if (resultado.estado === 'llena') {
    hablar('La lista está llena. Borra una tarea primero');
    return;
  }
  abrirTareas();
  const recortada = texto.length > campo.maxLength;   // el campo tiene un límite de letras
  hablar(`${recortada ? 'Tarea agregada y recortada' : 'Tarea agregada'}: ${resultado.tarea.texto}`);
}

// Encuentra UNA tarea según lo dicho: por número ("la tarea 2", "la segunda tarea") o por texto
// Devuelve { tarea } o { error }
function buscarTarea(texto) {
  const lista = obtenerTareas();
  if (lista.length === 0) return { error: 'No tienes tareas' };

  const [antes, despuesDeTarea = ''] = texto.split(/\btarea\b/);

  // 1) Por número. El ordinal se busca ANTES de la palabra "tarea", para no confundirlo con el texto de la tarea
  const ordinal = antes.match(/\b(primer|primera|primero|segunda|segundo|tercer|tercera|tercero|cuarta|cuarto|quinta|quinto)\b/);
  const cifra = palabrasANumeros(texto).match(/\btarea (?:numero )?(\d+)\b/);
  const numero = ordinal ? ORDINALES[ordinal[1]] : cifra ? Number(cifra[1]) : null;

  if (numero !== null) {
    const tarea = lista[numero - 1];
    return tarea ? { tarea } : { error: `No tengo una tarea número ${numero}` };
  }

  // 2) Por texto: todas las palabras dichas deben aparecer en la tarea
  const consulta = despuesDeTarea
    .replace(/^\s*(de|del|que dice|que diga)\s+/, '')
    .replace(/\s+(como\s+)?(hecha|hecho|lista|listo|completada|completado|terminada|terminado)\s*$/, '')
    .trim();

  if (consulta === '') return { error: 'Dime cuál tarea, por ejemplo: la tarea dos' };

  const palabras = consulta.split(/\s+/);
  const coinciden = lista.filter((tarea) => {
    const textoTarea = normalizar(tarea.texto);
    return palabras.every((palabra) => textoTarea.includes(palabra));
  });

  if (coinciden.length === 0) return { error: 'No encontré esa tarea' };
  if (coinciden.length > 1) return { error: 'Hay varias tareas parecidas. Dime el número' };
  return { tarea: coinciden[0] };
}

function cambiarEstadoPorVoz(texto) {
  const hecha = !dijoPalabra(texto, DESMARCAR);     // "desmarca" la deja pendiente; los demás la tachan
  const resultado = buscarTarea(texto);
  if (resultado.error) {
    hablar(resultado.error);
    return;
  }
  marcarTarea(resultado.tarea.id, hecha);
  abrirTareas();
  hablar(hecha ? `Tachada: ${resultado.tarea.texto}` : `Pendiente otra vez: ${resultado.tarea.texto}`);
}

function borrarPorVoz(texto) {
  const resultado = buscarTarea(texto);
  if (resultado.error) {
    hablar(resultado.error);
    return;
  }
  eliminarTarea(resultado.tarea.id);
  abrirTareas();
  hablar(`Borrada: ${resultado.tarea.texto}`);
}

// ---------- Modo descanso ----------

function dormir() {
  dormido = true;
  document.body.classList.add('dormido');   // la cortina negra aparece (ver voz.css)
  aviso.textContent = '';
}

function despertar() {
  dormido = false;
  document.body.classList.remove('dormido');
}

// Si está dormido, lo despierta y avisa con true para que quien llamó no haga nada más
function despertarSiDuerme(evento) {
  if (!dormido) return false;
  evento.preventDefault();
  despertar();
  return true;
}

// ---------- Comandos ----------

const CERRAR = ['cierra', 'cerrar', 'oculta', 'esconde', 'quita'];
const PARAR = ['deten', 'pausa', 'frena', 'cancela', 'apaga'];   // "apaga" solo cuenta junto a "temporizador"
const EMPEZAR = ['pon', 'inicia', 'programa', 'arranca', 'empieza', 'comienza', 'activa'];
const AGREGAR = ['agrega', 'agregame', 'anade', 'anademe', 'crea', 'apunta', 'anota', 'nueva'];
const TACHAR = ['tacha', 'tachar', 'completa', 'completar', 'marca', 'marcar'];
const DESMARCAR = ['desmarca', 'destacha'];
const BORRAR = ['borra', 'borrar', 'elimina', 'eliminar', 'quita', 'quitar'];
// Palabras para el modo descanso. Se busca la palabra COMPLETA: "descanso" (el del pomodoro) no cuenta
const DORMIR = ['descansa', 'duerme', 'apagate', 'desactivate'];

// Arreglo de comandos. El orden importa: se usa el primero que coincida
const comandos = [
  // 0. Memo: va primero para que nada más se confunda con estas frases
  { coincide: (t) => dijoAlguna(t, NOMBRES) && dijoAlguna(t, ['hablar', 'platicar', 'conversar']),
    accion: () => { entrarModoMiko(); hablar('Aquí estoy. ¿Qué necesitas?'); } },

  // Solo cuenta si Miko está al frente: "adiós", "regresa", "vuelve", "atrás", "salir"
  { coincide: (t) => modoMiko && dijoAlguna(t, ['adios', 'regresa', 'vuelve', 'atras', 'salir']),
    accion: () => { salirModoMiko(); hablar('Aquí estaré'); } },

  // 1. Agregar tarea va primero: así el texto de la tarea nunca se confunde con otro comando
  //    ("agrega la tarea cerrar la caja" no debe cerrar el panel)
  { coincide: (t) => dijoPalabra(t, AGREGAR) && /\btarea\b/.test(t),
    accion: (t, original) => agregarPorVoz(original) },

  // 2. Modo descanso: la palabra sola o en una frase corta (máximo 4 palabras)
  { coincide: (t) => dijoPalabra(t, DORMIR) && t.split(/\s+/).length <= 4,
    accion: () => dormir() },

  // 3. y 4. Tachar y borrar una tarea concreta (exigen la palabra "tarea" en singular)
  { coincide: (t) => dijoPalabra(t, [...TACHAR, ...DESMARCAR]) && /\btarea\b/.test(t),
    accion: (t) => cambiarEstadoPorVoz(t) },

  { coincide: (t) => dijoPalabra(t, BORRAR) && /\btarea\b/.test(t),
    accion: (t) => borrarPorVoz(t) },

  // 5. y 6. Cerrar paneles ("quita las tareas", en plural, llega hasta aquí)
  { coincide: (t) => dijoAlguna(t, CERRAR) && t.includes('tarea'),
    accion: () => cerrarTareas() },

  { coincide: (t) => dijoAlguna(t, CERRAR) && t.includes('temporizador'),
    accion: () => cerrarTemporizador() },

  // Pedir borrar o tachar "las tareas" en plural: no se puede, y no debe fingir que sí
  { coincide: (t) => dijoPalabra(t, ['borra', 'borrar', 'elimina', 'eliminar', 'tacha', 'tachar']) && /\btareas\b/.test(t),
    accion: () => hablar('Dime cuál tarea. Por ejemplo: borra la tarea dos') },

  // 7. Parar. "para el temporizador" cuenta, pero "temporizador para 5 minutos" no
  { coincide: (t) => t.includes('temporizador')
      && (dijoAlguna(t, PARAR) || /\bpara (el|la|este|ese) temporizador\b/.test(t)),
    accion: () => detener() },

  { coincide: (t) => t.includes('reinicia') && t.includes('temporizador'),
    accion: () => reiniciar() },

  // 9. Arrancar: necesita un verbo de inicio O una duración ("temporizador de 5 minutos")
  { coincide: (t) => t.includes('temporizador') && (dijoPalabra(t, EMPEZAR) || extraerSegundos(t) !== null),
    accion: (t) => programarTemporizador(t) },

  { coincide: (t) => dijoAlguna(t, ['clima', 'temperatura']),
    accion: () => decirClima() },

  { coincide: (t) => dijoAlguna(t, ['que dia', 'que fecha', 'a cuantos estamos']),
    accion: () => decirFecha() },

  { coincide: (t) => /\bhora\b/.test(t) && !t.includes('temporizador'),
    accion: () => decirHora() },

  // Al final, lo más general: cualquier mención de las tareas las muestra
  { coincide: (t) => /\btareas?\b/.test(t),
    accion: () => { abrirTareas(); hablar('Estas son tus tareas'); } }
];

function procesar(textoOriginal) {
  const texto = normalizar(textoOriginal);
  const comando = comandos.find((c) => c.coincide(texto, textoOriginal));  // primer comando que coincide
  if (!comando) {
    hablar('No entendí');
    return;
  }
  comando.accion(texto, textoOriginal);
}

// ---------- Micrófono ----------

function escuchar() {
  if (!reconocimiento) {
    mostrarAviso('Este navegador no soporta reconocimiento de voz');
    return;
  }
  if (escuchando) return;
  escuchando = true;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();   // si estaba hablando, se calla para no escucharse

  try {
    reconocimiento.start();
  } catch (error) {                       // por ejemplo, un permiso bloqueado
    escuchando = false;                   // sin esto se quedaría "escuchando" para siempre
    mostrarAviso('No pude activar el micrófono');
  }
}

if (reconocimiento) {
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

  // Clic derecho = hablar. Con Shift o Ctrl se abre el menú normal del navegador (para "Inspeccionar")
  document.addEventListener('contextmenu', (evento) => {
    if (evento.shiftKey || evento.ctrlKey) return;
    evento.preventDefault();
    if (despertarSiDuerme(evento)) return;   // dormido: solo despierta, no escucha
    escuchar();
  });
}

// ---------- Despertar y botón físico ----------

// Mientras está dormido, cualquier tecla o clic izquierdo (o toque) lo despierta.
// Si está despierto, la tecla TECLA activa el micrófono.
document.addEventListener('keydown', (evento) => {
  if (despertarSiDuerme(evento)) return;
  if (evento.key === TECLA && !evento.repeat) {   // repeat: ignora la repetición si dejas el botón pulsado
    evento.preventDefault();
    escuchar();
  }
});

document.addEventListener('pointerdown', (evento) => {
  if (evento.button === 0) despertarSiDuerme(evento);   // el clic derecho lo atiende "contextmenu"
});

// Cuando el temporizador termina: despierta la pantalla y lo dice en voz alta
document.addEventListener('temporizador-terminado', () => {
  despertar();
  hablar('El temporizador terminó');
});
