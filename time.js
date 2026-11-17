const inicio = Date.now();
const contador = document.querySelector('#contador');
setInterval(() => {
  const segundos = Math.floor((Date.now() - inicio) / 1000);
  contador.textContent = segundos + ' s';
}, 1000);