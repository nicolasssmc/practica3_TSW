import express from 'express';
import path from 'path';
import url from 'url';
//import { model } from './model/model.mjs';
import { seed } from './model/seeder.mjs';
import apiRouter from './routes/api.mjs'; // Importaremos las rutas aquí

const STATIC_DIR = url.fileURLToPath(new URL('.', import.meta.url));
const PORT = 3000;

const app = express();

// Configuración según Diapositiva 17
seed(); // Sembrar datos al inicio
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <--- LÍNEA NUEVA DEL PDF

// Rutas de la API
app.use('/api', apiRouter);

// Servir estáticos y SPA
app.use('/', express.static(path.join(STATIC_DIR, 'public')));
app.use('/test', express.static(path.join(STATIC_DIR, 'test')));

app.use('/libreria*', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'public/libreria/index.html'));
});

// Manejo de error 404 (Diapositiva 56)
app.all('*', function (req, res, next) {
  console.error(`${req.originalUrl} not found!`);
  res.status(404).send('<html><head><title>Not Found</title></head><body><h1>Not found!</h1></body></html>');
});

app.listen(PORT, function () {
  console.log(`Static HTTP server listening on ${PORT}`);
});

export { app };