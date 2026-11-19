// Miko: modo "hablar con Miko". El diseño y las animaciones están en miko.css.
// Aquí solo se enciende y se apaga UNA clase en <body>; el CSS hace todo el movimiento,
// y como usa transiciones, al quitar la clase todo vuelve solo a su lugar.

let modoMiko = false;   // true = Miko está al frente

function entrarModoMiko() {
  if (modoMiko) return;
  modoMiko = true;
  document.body.classList.add('modo-miko');      // Miko se acerca y lo demás baja
}

function salirModoMiko() {
  if (!modoMiko) return;
  modoMiko = false;
  document.body.classList.remove('modo-miko');   // Miko regresa atrás y lo demás sube
}

// ---------- Boca al hablar ----------
// La boca tiene 4 formas (están en miko-habla.css): cerrada, media, abierta y redonda.
// Aquí solo se cambia el atributo data-boca; el CSS dibuja la forma.

const bocaMiko = document.querySelector('.miko-boca');

// Recibe una palabra y elige la forma según su primera vocal: a = abierta, e/i = media, o/u = redonda
function moverBoca(palabra) {
  if (!bocaMiko) return;
  const limpia = palabra.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');      // sin acentos: "está" -> "esta"
  const sinUMuda = limpia.replace(/([qg])u(?=[ei])/g, '$1');   // la u de "qué" o "guerra" no suena
  const vocal = sinUMuda.match(/[aeiou]/);     // primera vocal que aparezca
  const formas = { a: 'abierta', e: 'media', i: 'media', o: 'redonda', u: 'redonda' };
  bocaMiko.dataset.boca = vocal ? formas[vocal[0]] : 'cerrada';
}

function cerrarBoca() {
  if (bocaMiko) bocaMiko.dataset.boca = 'cerrada';
}
