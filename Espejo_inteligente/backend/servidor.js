const express = require('express');
const app = express();

const datos = {'dato': "texto de datos", 'categoria': "texto de categoria"};

app.get('/api/dato', (peticion, respuesta) => {
    const fecha1 = 20260101;
  const indice =  Date.now();
  console.log('Indice calculado:', indice.get);

  respuesta.json({ dato: datos[indice] });
});

app.listen(3000, () => console.log('Servidor en http://localhost:3000'));