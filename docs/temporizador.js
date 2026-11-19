const botonAbrir = document.querySelector('#boton-temporizador');
const tarjetaMinutos = document.querySelector('#temporizador-minutos');
const tarjetaSegundos = document.querySelector('#temporizador-segundos');
const botonIniciar = document.querySelector('#iniciar-temporizador');
const botonReiniciar = document.querySelector('#reiniciar-temporizador');
const controles = document.querySelector('.temporizador-controles');

const DURACION_MAXIMA = 99 * 60 + 59; // en segundos

let duracion = 25 * 60;          // lo que ajustas, en segundos
let restante = duracion * 1000;  // lo que falta cuando está detenido, en milisegundos
let fin = 0;                     // hora (en milisegundos) a la que termina
let intervalo = null;            // null = detenido

function mostrar(milisegundos) {
  const total = Math.ceil(Math.max(0, milisegundos) / 1000);
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;

  actualizarTarjeta(tarjetaMinutos, String(minutos).padStart(2, '0'));
  actualizarTarjeta(tarjetaSegundos, String(segundos).padStart(2, '0'));
}

function tic() {
  const faltan = fin - Date.now();

  if (faltan <= 0) {
    clearInterval(intervalo);
    intervalo = null;
    restante = 0;
    mostrar(0);
    botonIniciar.textContent = 'Iniciar';

    // Primero se arregla la pantalla, y al final se avisa a quien quiera enterarse.
    // Este archivo ya no depende de voz.js: si voz.js no existe, simplemente nadie escucha el aviso.
    document.dispatchEvent(new CustomEvent('temporizador-terminado'));
    return;
  }

  mostrar(faltan);
}

function iniciar() {
  if (intervalo !== null || restante <= 0) return;

  fin = Date.now() + restante;
  intervalo = setInterval(tic, 200);
  botonIniciar.textContent = 'Detener';
}

function detener() {
  clearInterval(intervalo);
  intervalo = null;
  restante = Math.max(0, fin - Date.now());
  botonIniciar.textContent = 'Iniciar';
}

function reiniciar() {
  clearInterval(intervalo);
  intervalo = null;
  restante = duracion * 1000;
  botonIniciar.textContent = 'Iniciar';
  mostrar(restante);
}

function abrirTemporizador() {
  document.body.classList.add('temporizador-abierto');
}

function cerrarTemporizador() {
  document.body.classList.remove('temporizador-abierto');
}

// Recibe segundos, los deja como nueva duración y reinicia la pantalla.
// Devuelve la duración que quedó aplicada (puede ser menor si pasaba del máximo).
function ajustarDuracion(totalSegundos) {
  duracion = Math.min(DURACION_MAXIMA, Math.max(0, totalSegundos));
  reiniciar();   // reiniciar ya detiene el intervalo, recalcula "restante" y llama a mostrar
  return duracion;
}

botonAbrir.addEventListener('click', () => {
  if (document.body.classList.contains('temporizador-abierto')) {
    cerrarTemporizador();
  } else {
    abrirTemporizador();
  }
});

botonIniciar.addEventListener('click', () => {
  if (intervalo === null) {
    iniciar();
  } else {
    detener();
  }
});

botonReiniciar.addEventListener('click', reiniciar);

controles.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-ajuste]');

  if (!boton || intervalo !== null) return;

  const segundosPorUnidad = boton.dataset.ajuste === 'minutos' ? 60 : 1;
  const paso = Number(boton.dataset.paso);

  ajustarDuracion(duracion + segundosPorUnidad * paso);
});

mostrar(restante);
