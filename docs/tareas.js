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

// ----- Funciones que usan tanto los botones como la voz -----

// Devuelve { estado: 'ok' | 'vacia' | 'llena', tarea }
function agregarTarea(textoCrudo) {
  const texto = textoCrudo.trim().slice(0, campo.maxLength);   // respeta el límite del campo
  if (texto === '') return { estado: 'vacia' };
  if (tareas.length >= MAX_TAREAS) return { estado: 'llena' };

  const tarea = { id: Date.now(), texto, hecha: false };
  tareas.push(tarea);
  guardar();
  dibujar();
  return { estado: 'ok', tarea };
}

function marcarTarea(id, hecha) {
  tareas = tareas.map((tarea) => (tarea.id === id ? { ...tarea, hecha } : tarea));
  guardar();
  dibujar();
}

function eliminarTarea(id) {
  tareas = tareas.filter((tarea) => tarea.id !== id);
  guardar();
  dibujar();
}

// Una copia: así quien la pida no puede modificar tu arreglo sin querer
function obtenerTareas() {
  return [...tareas];
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

  const resultado = agregarTarea(campo.value);
  if (resultado.estado === 'ok') campo.value = '';
});

lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-accion]');
  if (!boton) return;

  const id = Number(boton.closest('li').dataset.id);

  if (boton.dataset.accion === 'alternar') {
    const tarea = tareas.find((t) => t.id === id);
    marcarTarea(id, !tarea.hecha);
  } else {
    eliminarTarea(id);
  }
});

dibujar();
