// middleware/auth.js
// Middleware que verifica el token JWT en cada petición protegida
// Si el token es válido deja pasar, si no devuelve error 401

const jwt = require('jsonwebtoken'); // Librería para verificar tokens JWT

const verifyToken = (req, res, next) => {
    // El token viene en el header Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];

    // Si no hay header de autorización, rechazamos la petición
    if (!authHeader) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    // El header viene como "Bearer eltoken123", nos quedamos solo con el token
    const token = authHeader.split(' ')[1];

    // Verificamos que el token sea válido usando la clave secreta del .env
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // Token inválido o expirado
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Si el token es válido guardamos los datos del usuario en req.user
        // Así los controladores saben quién está haciendo la petición
        req.user = decoded;

        // Pasamos al siguiente middleware o controlador
        next();
    });
};

module.exports = verifyToken;