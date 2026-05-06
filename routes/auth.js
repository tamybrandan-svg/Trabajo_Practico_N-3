// routes/auth.js
// Define las rutas de autenticación: registro y login
// Estas rutas NO requieren token JWT, son públicas

const express = require('express');
const router = express.Router(); // Mini-app de Express para agrupar rutas

// Importamos los controladores de autenticación
const { register, login } = require('../controllers/authController');

// POST /api/auth/register → Registrar nuevo usuario
// El cliente envía: nombre, email, password
router.post('/register', register);

// POST /api/auth/login → Iniciar sesión
// El cliente envía: email, password
// El servidor devuelve: token JWT
router.post('/login', login);

module.exports = router;