// routes/tickets.js
// Define las rutas del recurso principal: tickets
// Todas estas rutas requieren token JWT (están protegidas)

const express = require('express');
const router = express.Router(); // Mini-app de Express para agrupar rutas

// Importamos los controladores de tickets
const { 
    getAllTickets,
    getTicketById,
    createTicket,
    updateTicket,
    deleteTicket
} = require('../controllers/ticketsController');

// Importamos el middleware que verifica el token JWT
const verifyToken = require('../middleware/auth');

// GET /api/tickets → Obtener todos los tickets
router.get('/', verifyToken, getAllTickets);

// GET /api/tickets/:id → Obtener un ticket por ID
router.get('/:id', verifyToken, getTicketById);

// POST /api/tickets → Crear un nuevo ticket
// Usa transacción en el controlador
router.post('/', verifyToken, createTicket);

// PUT /api/tickets/:id → Actualizar un ticket
// Aquí se dispara el trigger cuando cambia el estado
router.put('/:id', verifyToken, updateTicket);

// DELETE /api/tickets/:id → Eliminar un ticket
router.delete('/:id', verifyToken, deleteTicket);

module.exports = router;