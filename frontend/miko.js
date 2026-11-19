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
