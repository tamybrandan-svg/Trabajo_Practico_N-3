// controllers/ticketsController.js
// Lógica de todas las operaciones sobre tickets
// Incluye transacción al crear y eliminar tickets

const pool = require('../db/index'); // Conexión a la base de datos

// ── GET TODOS ────────────────────────────────────────────────
// GET /api/tickets
// Devuelve todos los tickets con nombre del cliente y categoría
const getAllTickets = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.id_ticket, t.asunto, t.estado, t.fecha_creacion,
                   u.nombre AS cliente, a.nombre AS agente,
                   c.nombre AS categoria
            FROM tickets t
            JOIN usuarios u ON t.id_cliente = u.id_usuario
            LEFT JOIN usuarios a ON t.id_agente = a.id_usuario
            JOIN categorias c ON t.id_categoria = c.id_categoria
            ORDER BY t.fecha_creacion DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error obteniendo tickets:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ── GET POR ID ───────────────────────────────────────────────
// GET /api/tickets/:id
// Devuelve un ticket específico con sus comentarios
const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscamos el ticket
        const [ticket] = await pool.query(`
            SELECT t.*, u.nombre AS cliente, a.nombre AS agente,
                   c.nombre AS categoria
            FROM tickets t
            JOIN usuarios u ON t.id_cliente = u.id_usuario
            LEFT JOIN usuarios a ON t.id_agente = a.id_usuario
            JOIN categorias c ON t.id_categoria = c.id_categoria
            WHERE t.id_ticket = ?
        `, [id]);

        // Si no existe el ticket
        if (ticket.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        // Buscamos los comentarios del ticket
        const [comentarios] = await pool.query(`
            SELECT c.mensaje, c.fecha, u.nombre AS usuario
            FROM comentarios c
            JOIN usuarios u ON c.id_usuario = u.id_usuario
            WHERE c.id_ticket = ?
            ORDER BY c.fecha ASC
        `, [id]);

        // Devolvemos el ticket con sus comentarios
        res.status(200).json({ 
            ...ticket[0], 
            comentarios 
        });

    } catch (error) {
        console.error('Error obteniendo ticket:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ── CREAR TICKET ─────────────────────────────────────────────
// POST /api/tickets
// Usa transacción: crea el ticket y el primer comentario juntos
// Si algo falla hace ROLLBACK y no queda nada a medias
const createTicket = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { asunto, descripcion, id_categoria } = req.body;
        const id_cliente = req.user.id; // Viene del token JWT verificado

        // Validamos campos obligatorios
        if (!asunto || !descripcion || !id_categoria) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // ── Iniciamos la transacción ──
        await connection.beginTransaction();

        // Insertamos el ticket
        const [result] = await connection.query(
            'INSERT INTO tickets (asunto, descripcion, id_cliente, id_categoria) VALUES (?, ?, ?, ?)',
            [asunto, descripcion, id_cliente, id_categoria]
        );

        const id_ticket = result.insertId; // ID del ticket recién creado

        // Insertamos el primer comentario automático
        await connection.query(
            'INSERT INTO comentarios (mensaje, id_ticket, id_usuario) VALUES (?, ?, ?)',
            ['Ticket creado correctamente', id_ticket, id_cliente]
        );

        // ── Todo salió bien, confirmamos la transacción ──
        await connection.commit();

        res.status(201).json({ 
            mensaje: 'Ticket creado correctamente',
            id_ticket 
        });

    } catch (error) {
        // ── Algo falló, deshacemos todo ──
        await connection.rollback();
        console.error('Error creando ticket:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        // Siempre devolvemos la conexión al pool
        connection.release();
    }
};

// ── ACTUALIZAR TICKET ────────────────────────────────────────
// PUT /api/tickets/:id
// Aquí se dispara el trigger cuando cambia el estado
const updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { asunto, estado, id_agente } = req.body;

        await pool.query(
            'UPDATE tickets SET asunto = ?, estado = ?, id_agente = ? WHERE id_ticket = ?',
            [asunto, estado, id_agente, id]
        );

        res.status(200).json({ mensaje: 'Ticket actualizado correctamente' });

    } catch (error) {
        console.error('Error actualizando ticket:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ── ELIMINAR TICKET ──────────────────────────────────────────
// DELETE /api/tickets/:id
// Usa transacción: borra comentarios, historial y ticket juntos
// Si algo falla hace ROLLBACK
const deleteTicket = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        // Iniciamos transacción para borrar todo junto
        await connection.beginTransaction();

        // Primero borramos los comentarios del ticket
        await connection.query(
            'DELETE FROM comentarios WHERE id_ticket = ?', [id]
        );

        // Después borramos el historial de estados
        await connection.query(
            'DELETE FROM historial_estados WHERE id_ticket = ?', [id]
        );

        // Finalmente borramos el ticket
        const [result] = await connection.query(
            'DELETE FROM tickets WHERE id_ticket = ?', [id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        await connection.commit();
        res.status(200).json({ mensaje: 'Ticket eliminado correctamente' });

    } catch (error) {
        await connection.rollback();
        console.error('Error eliminando ticket:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        connection.release();
    }
};

module.exports = { getAllTickets, getTicketById, createTicket, updateTicket, deleteTicket };