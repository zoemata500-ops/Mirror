const MAX_TAREAS = 5;
const CLAVE = 'espejo-tareas';

const botonTareas = document.querySelector('#boton-tareas');
const formulario = document.querySelector('#form-tareas');
const campo = document.querySelector('#nueva-tarea');
const lista = document.querySelector('#lista-tareas');

function cargarTareas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || [];
  } catch {
    return [];
  }
}

let tareas = cargarTareas();

function guardar() {
  localStorage.setItem(CLAVE, JSON.stringify(tareas));
}

function crearItem(tarea) {
  const item = document.createElement('li');
  item.className = tarea.hecha ? 'tarea hecha' : 'tarea';
  item.dataset.id = tarea.id;

  const texto = document.createElement('button');
  texto.type = 'button';
  texto.className = 'tarea-texto';
  texto.dataset.accion = 'alternar';
  texto.textContent = tarea.texto;

  const borrar = document.createElement('button');
  borrar.type = 'button';
  borrar.className = 'tarea-borrar';
  borrar.dataset.accion = 'borrar';
  borrar.setAttribute('aria-label', 'Borrar tarea');
  borrar.textContent = '×';

  item.append(texto, borrar);
  return item;
}

function dibujar() {
  lista.replaceChildren(...tareas.map(crearItem));

  const llena = tareas.length >= MAX_TAREAS;
  campo.disabled = llena;
  campo.placeholder = llena ? 'Lista llena' : 'Nueva tarea';
}
function abrirTareas() {
  document.body.classList.add('tareas-abierto');       // add: siempre abre, nunca alterna
}

function cerrarTareas() {
  document.body.classList.remove('tareas-abierto');    // remove: siempre cierra
}

botonTareas.addEventListener('click', () => {
  if (document.body.classList.contains('tareas-abierto')) {  // ¿ya está abierto?
    cerrarTareas();                                    // sí: cierra
  } else {
    abrirTareas();                                     // no: abre
    if (!campo.disabled) campo.focus();                // el foco al campo solo con el botón, no con la voz
  }
});


formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const texto = campo.value.trim();
  if (texto === '' || tareas.length >= MAX_TAREAS) return;

  tareas.push({ id: Date.now(), texto, hecha: false });
  campo.value = '';
  guardar();
  dibujar();
});

lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-accion]');
  if (!boton) return;

  const id = Number(boton.closest('li').dataset.id);

  if (boton.dataset.accion === 'alternar') {
    tareas = tareas.map((tarea) => {
      return tarea.id === id ? { ...tarea, hecha: !tarea.hecha } : tarea;
    });
  } else {
    tareas = tareas.filter((tarea) => tarea.id !== id);
  }

  guardar();
  dibujar();
});

dibujar();
