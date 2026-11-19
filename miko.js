// Miko: modo "hablar con Miko". El diseño y las animaciones están en miko.css.
// Aquí solo se enciende y se apaga una clase en <body>; el CSS hace el resto.

let modoMiko = false;   // true = Miko está al frente

function entrarModoMiko() {
  if (modoMiko) return;
  modoMiko = true;
  document.body.classList.remove('saliendo-miko');
  document.body.classList.add('modo-miko');        // Miko se acerca y lo demás baja
}

function salirModoMiko() {
  if (!modoMiko) return;
  modoMiko = false;
  document.body.classList.remove('modo-miko');
  document.body.classList.add('saliendo-miko');    // lo demás vuelve a subir
  setTimeout(() => document.body.classList.remove('saliendo-miko'), 900);  // al terminar, se limpia la clase
}
