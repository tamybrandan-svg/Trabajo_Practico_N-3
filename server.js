// server.js
// Punto de entrada de la aplicación
// Aquí arranca el servidor, se configuran los middlewares y se montan las rutas

require('dotenv').config();         // Carga las variables del archivo .env
const express = require('express'); // Framework para crear el servidor
const path = require('path');       // Módulo nativo de Node para rutas de archivos

// Importamos las rutas
const authRoutes = require('./routes/auth');        // Rutas de registro y login
const ticketsRoutes = require('./routes/tickets');  // Rutas de tickets

const app = express();  // Creamos la aplicación Express
const PORT = process.env.PORT || 3000; // Puerto desde .env o 3000 por defecto

// ── Middlewares ──────────────────────────────────────────────
// express.json() permite leer el body de peticiones POST/PUT en formato JSON
app.use(express.json());

// express.static() sirve los archivos de public/ al navegador
// Cuando el usuario visita http://localhost:3000 recibe public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// ── Rutas de la API ──────────────────────────────────────────
// Montamos las rutas bajo sus prefijos correspondientes
app.use('/api/auth', authRoutes);       // POST /api/auth/register y /api/auth/login
app.use('/api/tickets', ticketsRoutes); // GET, POST, PUT, DELETE /api/tickets

// ── Manejo de errores ────────────────────────────────────────
// Middleware de errores, siempre va al final
// Express lo reconoce porque tiene 4 parámetros (err, req, res, next)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor'
    });
});

// ── Iniciar el servidor ───────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});