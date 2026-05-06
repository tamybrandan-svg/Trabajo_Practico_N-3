// Este archivo conecta Node.js con MySQL
// Usamos un pool de conexiones para manejar múltiples peticiones

const mysql = require('mysql2');    // Librería para conectar con MySQL
require('dotenv').config();         // Carga las variables del archivo .env

// Creamos el pool con los datos del .env
const pool = mysql.createPool({
    host: process.env.DB_HOST,      // Dirección del servidor MySQL
    port: process.env.DB_PORT,      // Puerto (3306 por defecto)
    database: process.env.DB_NAME,  // Nombre de la base de datos
    user: process.env.DB_USER,      // Usuario de MySQL
    password: process.env.DB_PASSWORD // Contraseña de MySQL
});

// Verificamos que la conexión funcione al iniciar
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.message);
    } else {
        console.log('✅ Conexión exitosa a MySQL');
        connection.release(); // Devolvemos la conexión al pool
    }
});

// Exportamos el pool para usarlo en los controladores
module.exports = pool.promise();