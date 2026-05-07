// public/app.js
const API_URL = '/api';

// ── UTILIDADES ───────────────────────────────────────────────

function mostrarMensaje(texto, esError = false) {
    const el = document.getElementById('mensaje');
    if (!el) return;
    el.textContent = texto;
    el.className = esError ? 'mensaje-error' : 'mensaje-ok';
    setTimeout(() => { el.textContent = ''; el.className = ''; }, 3000);
}

function mostrarMensajeAuth(texto, esError = false) {
    const els = document.querySelectorAll('#mensaje-auth');
    els.forEach(el => {
        el.textContent = texto;
        el.className = esError ? 'mensaje-error' : 'mensaje-ok';
        setTimeout(() => { el.textContent = ''; el.className = ''; }, 3000);
    });
}

function mostrarRegistro() {
    document.getElementById('form-login').style.display = 'none';
    document.getElementById('form-registro').style.display = 'flex';
}

function mostrarLogin() {
    document.getElementById('form-registro').style.display = 'none';
    document.getElementById('form-login').style.display = 'flex';
}

// ── AUTENTICACIÓN ────────────────────────────────────────────

// POST /api/auth/register
// Registra un nuevo usuario con el rol elegido
async function register() {
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const rol = document.getElementById('reg-rol').value;

    if (!nombre || !email || !password) {
        return mostrarMensajeAuth('Todos los campos son obligatorios', true);
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password, rol })
        });

        const data = await response.json();

        if (!response.ok) {
            return mostrarMensajeAuth(data.error, true);
        }

        mostrarMensajeAuth('Usuario registrado correctamente. Iniciá sesión.');
        mostrarLogin();

    } catch (error) {
        mostrarMensajeAuth('Error al registrar usuario', true);
    }
}

// POST /api/auth/login
// Inicia sesión y guarda el token en localStorage
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        return mostrarMensajeAuth('Email y contraseña son obligatorios', true);
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return mostrarMensajeAuth(data.error, true);
        }

        // Guardamos el token y datos del usuario en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        mostrarSeccionPrincipal(data.usuario);

    } catch (error) {
        mostrarMensajeAuth('Error al iniciar sesión', true);
    }
}

// Cierra la sesión borrando el token
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    document.getElementById('seccion-principal').style.display = 'none';
    document.getElementById('seccion-auth').style.display = 'flex';
    mostrarLogin();
}

// Muestra la sección principal después del login
function mostrarSeccionPrincipal(usuario) {
    document.getElementById('seccion-auth').style.display = 'none';
    document.getElementById('seccion-principal').style.display = 'block';
    document.getElementById('usuario-nombre').textContent = `👤 ${usuario.nombre} (${usuario.rol})`;

    if (usuario.rol === 'agente') {
        document.getElementById('seccion-crear').style.display = 'none';
        document.getElementById('vista-agente').style.display = 'block';
        document.getElementById('vista-cliente').style.display = 'none';
        document.getElementById('titulo-tickets').textContent = 'Todos los Tickets';
    } else {
        document.getElementById('seccion-crear').style.display = 'flex';
        document.getElementById('vista-agente').style.display = 'none';
        document.getElementById('vista-cliente').style.display = 'block';
        document.getElementById('titulo-tickets').textContent = 'Mis Tickets';
    }

    cargarTickets();
}

// ── TICKETS ──────────────────────────────────────────────────

// Función helper que agrega el token JWT a cada petición protegida
function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// GET /api/tickets
// Carga todos los tickets y los muestra según el rol
async function cargarTickets() {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const esAgente = usuario.rol === 'agente';

        const response = await fetch(`${API_URL}/tickets`, {
            headers: getHeaders()
        });

        const tickets = await response.json();

        if (esAgente) {
            // ── Vista agente: tabla completa con detalle al clickear ──
            const tbody = document.getElementById('tickets-body-agente');
            tbody.innerHTML = '';

            if (tickets.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">No hay tickets todavía</td></tr>';
                return;
            }

            tickets.forEach(ticket => {
                const fila = document.createElement('tr');
                fila.id = `fila-${ticket.id_ticket}`;
                fila.style.cursor = 'pointer';
                fila.innerHTML = `
                    <td onclick="verDetalles(${ticket.id_ticket})">#${ticket.id_ticket}</td>
                    <td onclick="verDetalles(${ticket.id_ticket})">${ticket.asunto}</td>
                    <td onclick="verDetalles(${ticket.id_ticket})">${ticket.categoria}</td>
                    <td onclick="verDetalles(${ticket.id_ticket})"><span class="estado estado-${ticket.estado}">${ticket.estado}</span></td>
                    <td onclick="verDetalles(${ticket.id_ticket})">${ticket.cliente}</td>
                    <td onclick="verDetalles(${ticket.id_ticket})">${new Date(ticket.fecha_creacion).toLocaleDateString()}</td>
                    <td>
                        <select onchange="cambiarEstado(${ticket.id_ticket}, this.value, '${ticket.asunto}')">
                            <option value="nuevo" ${ticket.estado === 'nuevo' ? 'selected' : ''}>Nuevo</option>
                            <option value="en_progreso" ${ticket.estado === 'en_progreso' ? 'selected' : ''}>En Progreso</option>
                            <option value="cerrado" ${ticket.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option>
                        </select>
                    </td>
                `;
                tbody.appendChild(fila);
            });

        } else {
            // ── Vista cliente: cards simples ──
            const container = document.getElementById('tickets-body-cliente');
            container.innerHTML = '';

            if (tickets.length === 0) {
                container.innerHTML = '<p>No tenés tickets todavía</p>';
                return;
            }

            tickets.forEach(ticket => {
                const card = document.createElement('div');
                card.className = 'ticket-card';
                card.innerHTML = `
                    <div class="ticket-card-info">
                        <span class="ticket-numero">Turno #${ticket.id_ticket}</span>
                        <span class="ticket-asunto">${ticket.asunto}</span>
                    </div>
                    <button onclick="eliminarTicket(${ticket.id_ticket})">🗑 Eliminar</button>
                `;
                container.appendChild(card);
            });
        }

    } catch (error) {
        mostrarMensaje('Error al cargar tickets', true);
    }
}

// GET /api/tickets/:id
// Muestra el detalle y comentarios del ticket al clickear una fila
async function verDetalles(id) {
    // Si ya está abierto lo cerramos
    const existente = document.getElementById(`detalle-${id}`);
    if (existente) {
        existente.remove();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tickets/${id}`, {
            headers: getHeaders()
        });

        const data = await response.json();

        const filaDetalle = document.createElement('tr');
        filaDetalle.id = `detalle-${id}`;
        filaDetalle.innerHTML = `
            <td colspan="7">
                <div class="detalle-ticket">
                    <h4>💬 Detalle del problema</h4>
                    <p class="ticket-descripcion-detalle">${data.descripcion}</p>
                    ${data.comentarios.length > 1
                        ? `<h4 style="margin-top:12px">📝 Comentarios</h4>
                           ${data.comentarios.slice(1).map(c => `
                            <div class="comentario">
                                <span class="comentario-usuario">👤 ${c.usuario}</span>
                                <span class="comentario-fecha">${new Date(c.fecha).toLocaleString()}</span>
                                <p class="comentario-mensaje">${c.mensaje}</p>
                            </div>
                        `).join('')}`
                        : ''
                    }
                </div>
            </td>
        `;

        const filaTicket = document.getElementById(`fila-${id}`);
        filaTicket.insertAdjacentElement('afterend', filaDetalle);

    } catch (error) {
        mostrarMensaje('Error al cargar detalles', true);
    }
}

// POST /api/tickets
// Crea un nuevo ticket con transacción en el backend
async function crearTicket() {
    const asunto = document.getElementById('ticket-asunto').value;
    const descripcion = document.getElementById('ticket-descripcion').value;
    const id_categoria = document.getElementById('ticket-categoria').value;

    if (!asunto || !descripcion || !id_categoria) {
        return mostrarMensaje('Todos los campos son obligatorios', true);
    }

    try {
        const response = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ asunto, descripcion, id_categoria })
        });

        const data = await response.json();

        if (!response.ok) {
            return mostrarMensaje(data.error, true);
        }

        mostrarMensaje('Ticket creado correctamente');
        document.getElementById('ticket-asunto').value = '';
        document.getElementById('ticket-descripcion').value = '';
        document.getElementById('ticket-categoria').value = '';
        cargarTickets();

    } catch (error) {
        mostrarMensaje('Error al crear ticket', true);
    }
}

// PUT /api/tickets/:id
// Cambia el estado de un ticket (solo agentes)
// Aquí se dispara el trigger en la base de datos
async function cambiarEstado(id, estado, asunto) {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));

        const response = await fetch(`${API_URL}/tickets/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                asunto,
                estado,
                id_agente: usuario.id
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return mostrarMensaje(data.error, true);
        }

        mostrarMensaje('Estado actualizado correctamente');
        cargarTickets();

    } catch (error) {
        mostrarMensaje('Error al cambiar estado', true);
    }
}

// DELETE /api/tickets/:id
// Elimina un ticket con transacción en el backend
async function eliminarTicket(id) {
    if (!confirm('¿Seguro que querés eliminar este ticket?')) return;

    try {
        const response = await fetch(`${API_URL}/tickets/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            return mostrarMensaje(data.error, true);
        }

        mostrarMensaje('Ticket eliminado correctamente');
        cargarTickets();

    } catch (error) {
        mostrarMensaje('Error al eliminar ticket', true);
    }
}

// ── INICIO ───────────────────────────────────────────────────
// Al cargar la página verificamos si ya hay sesión activa
window.onload = () => {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    if (token && usuario) {
        mostrarSeccionPrincipal(usuario);
    }
};