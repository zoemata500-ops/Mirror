// Dos decimales (~1 km): el clima sale igual y no publicas tu ubicación exacta en GitHub
const LATITUD = 19.20;
const LONGITUD = -99.56;
const CIUDAD = 'Ciudad de México';   // CAMBIA esto por tu municipio: el espejo lo dice en voz alta
const INTERVALO = 15 * 60 * 1000; // 15 minutos, en milisegundos

const panelClima = document.querySelector('#clima');
const climaTemp = document.querySelector('#clima-temp');
const climaCiudad = document.querySelector('#clima-ciudad');
const climaEstado = document.querySelector('#clima-estado');
const climaRango = document.querySelector('#clima-rango');

const parametros = new URLSearchParams({
  latitude: LATITUD,
  longitude: LONGITUD,
  current: 'temperature_2m,weather_code',
  daily: 'temperature_2m_max,temperature_2m_min',
  timezone: 'auto',
  forecast_days: 1
});

const URL_CLIMA = `https://api.open-meteo.com/v1/forecast?${parametros}`;

function describirClima(codigo) {
  if (codigo === 0) return 'Despejado';
  if (codigo <= 2) return 'Poco nublado';
  if (codigo === 3) return 'Nublado';
  if (codigo === 45 || codigo === 48) return 'Niebla';
  if (codigo >= 51 && codigo <= 57) return 'Llovizna';
  if (codigo >= 61 && codigo <= 67) return 'Lluvia';
  if (codigo >= 71 && codigo <= 77) return 'Nieve';
  if (codigo >= 80 && codigo <= 82) return 'Chubascos';
  if (codigo >= 85 && codigo <= 86) return 'Nevadas';
  if (codigo >= 95) return 'Tormenta';
  return 'Sin datos';
}

function mostrarClima(datos) {
  const maxima = Math.round(datos.daily.temperature_2m_max[0]);
  const minima = Math.round(datos.daily.temperature_2m_min[0]);

  climaTemp.textContent = Math.round(datos.current.temperature_2m) + '°';
  climaEstado.textContent = describirClima(datos.current.weather_code);
  climaRango.textContent = `${minima}° / ${maxima}°`;
}

async function cargarClima() {
  try {
    const respuesta = await fetch(URL_CLIMA);
    if (!respuesta.ok) throw new Error('Error ' + respuesta.status);

    const datos = await respuesta.json();
    if (!datos.current || !datos.daily) throw new Error('Respuesta inesperada');

    mostrarClima(datos);
    panelClima.classList.remove('desactualizado');
  } catch (error) {
    console.error('No se pudo cargar el clima:', error.message);
    panelClima.classList.add('desactualizado');

    if (climaTemp.textContent === '--°') {
      climaEstado.textContent = 'Sin conexión';
    }
  }
}

climaCiudad.textContent = CIUDAD;
cargarClima();
setInterval(cargarClima, INTERVALO);
window.addEventListener('online', cargarClima);
