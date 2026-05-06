// controllers/authController.js
// Lógica de registro y login de usuarios
// Aquí se hashea la contraseña y se genera el token JWT

const bcrypt = require('bcryptjs');     // Para hashear y verificar contraseñas
const jwt = require('jsonwebtoken');    // Para generar tokens JWT
const pool = require('../db/index');    // Conexión a la base de datos

// ── REGISTRO ─────────────────────────────────────────────────
// POST /api/auth/register
// Recibe: nombre, email, password
// Devuelve: mensaje de éxito
const register = async (req, res) => {
    try {
        // Extraemos los datos del body de la petición
        const { nombre, email, password } = req.body;

        // Validamos que no falte ningún campo
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // Hasheamos la contraseña antes de guardarla
        // El 10 es el nivel de seguridad (salt rounds)
        const password_hash = await bcrypt.hash(password, 10);

        // Insertamos el usuario en la base de datos
        await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)',
            [nombre, email, password_hash]
        );

        res.status(201).json({ mensaje: 'Usuario registrado correctamente' });

    } catch (error) {
        // Si el email ya existe MySQL devuelve error de UNIQUE
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        console.error('Error en register:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ── LOGIN ────────────────────────────────────────────────────
// POST /api/auth/login
// Recibe: email, password
// Devuelve: token JWT
const login = async (req, res) => {
    try {
        // Extraemos los datos del body
        const { email, password } = req.body;

        // Validamos que no falten campos
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y password son obligatorios' });
        }

        // Buscamos el usuario por email en la base de datos
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        // Si no existe el usuario
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const usuario = rows[0];

        // Comparamos la contraseña ingresada con el hash guardado
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Generamos el token JWT con los datos del usuario
        // El token expira en 24 horas
        const token = jwt.sign(
            { 
                id: usuario.id_usuario, 
                email: usuario.email,
                rol: usuario.rol 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Devolvemos el token y datos básicos del usuario
        res.status(200).json({ 
            token,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { register, login };