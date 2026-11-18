const horas = document.querySelector('#horas');
const minutos = document.querySelector('#minutos');
const fecha = document.querySelector('#fecha');
const dia = document.querySelector('#dia');
const meridiano = document.querySelector('#meridiano');
const segundos = document.querySelector('#segundos');

function poner(tarjeta, selector, texto) {
  tarjeta.querySelector(selector + ' span').textContent = texto;
}

function actualizarTarjeta(tarjeta, nuevo) {
  const anterior = tarjeta.dataset.valor;

  if (anterior === nuevo) return;

  // Primera vez: se escribe el número en las cuatro mitades, sin animación
  if (anterior === '') {
    ['.fija-arriba', '.fija-abajo', '.hoja-arriba', '.hoja-abajo'].forEach((mitad) => {
      poner(tarjeta, mitad, nuevo);
    });
    tarjeta.dataset.valor = nuevo;
    return;
  }

  // Cambio de número: se prepara la animación
  poner(tarjeta, '.fija-arriba', nuevo);
  poner(tarjeta, '.hoja-arriba', anterior);
  poner(tarjeta, '.hoja-abajo', nuevo);
  tarjeta.dataset.valor = nuevo;
  tarjeta.classList.add('animando');

  // Cuando la hoja de abajo termina de caer, se actualiza la mitad fija de abajo
  tarjeta.querySelector('.hoja-abajo').addEventListener('animationend', () => {
    poner(tarjeta, '.fija-abajo', nuevo);
    tarjeta.classList.remove('animando');
  }, { once: true });
}

function actualizarReloj() {
  const ahora = new Date();
  const hora24 = ahora.getHours();
  const hora12 = hora24 % 12 || 12;

  actualizarTarjeta(horas, String(hora12));
  actualizarTarjeta(minutos, String(ahora.getMinutes()).padStart(2, '0'));

  fecha.textContent = ahora.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' });
  dia.textContent = ahora.toLocaleDateString('es-MX', { weekday: 'long' });
  meridiano.textContent = hora24 >= 12 ? 'PM' : 'AM';
  segundos.textContent = String(ahora.getSeconds()).padStart(2, '0');
}
 
actualizarReloj();
setInterval(actualizarReloj, 1000);



// const temporizadorMinutos = document.querySelector('#temporizador-minutos');
// const temporizadorSegundos = document.querySelector('#temporizador-segundos');  
// const duracionMinutos = 0; // Duración del temporizador en minutos  
// const duracionSegundos = 10; // Convertir a segundos

// const duracionTotal = duracionMinutos * 60 + duracionSegundos; // Duración total en segundos
// const tiempoFinal = Math.ceil (Date.now() + (duracionTotal * 1000); // Tiempo final en milisegundos
// const intervalo = setInterval(() => {
//   const tiempoRestante =  tiempoFinal - Date.now(); // Tiempo restante en milisegundos
//   const minutosRestantes = Math.floor(tiempoRestante / 1000 / 60);
//   const segundosRestantes = Math.floor((tiempoRestante / 1000) % 60);

//   actualizarTarjeta(temporizadorMinutos, String(minutosRestantes).padStart(2, '0'));
//   actualizarTarjeta(temporizadorSegundos, String(segundosRestantes).padStart(2, '0')); 
//   if (tiempoRestante <= 0) {
//     clearInterval(intervalo);
//    actualizarTarjeta(temporizadorMinutos, '00');
//    actualizarTarjeta(temporizadorSegundos, '00')  ;
//   } 
// }, 1000);
