import express from 'express';
import path from 'path';
import url from 'url';
import { seed } from './model/seeder.mjs';
import { connectDB } from './model/model.mjs'; // Importamos el conector
import apiRouter from './routes/api.mjs';

const STATIC_DIR = url.fileURLToPath(new URL('.', import.meta.url));
const PORT = 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);
app.use('/', express.static(path.join(STATIC_DIR, 'public')));
app.use('/test', express.static(path.join(STATIC_DIR, 'test')));

app.use('/libreria*', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'public/libreria/index.html'));
});

app.all('*', function (req, res) {
  res.status(404).send('Not Found');
});

// Iniciamos BD y luego el servidor
// Nota: await top-level funciona en .mjs modernos
try {
    await connectDB();
    await seed(); // Opcional: reiniciar datos al arrancar
    
    app.listen(PORT, function () {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
} catch (error) {
    console.error("Error fatal al iniciar:", error);
}

export { app };