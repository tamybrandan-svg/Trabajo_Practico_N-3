// public/app.js
// Lógica del frontend
// Se comunica con la API usando fetch()
// Guarda el token JWT en localStorage para enviarlo en cada petición

const API_URL = '/api';

// ── UTILIDADES ───────────────────────────────────────────────

// Muestra un mensaje de éxito o error en pantalla
function mostrarMensaje(texto, esError = false) {
    const el = document.getElementById('mensaje');
    el.textContent = texto;
    el.className = esError ? 'mensaje-error' : 'mensaje-ok';
    setTimeout(() => { el.textContent = ''; el.className = ''; }, 3000);
}

// Muestra el formulario de registro y oculta el login
function mostrarRegistro() {
    document.getElementById('form-login').style.display = 'none';
    document.getElementById('form-registro').style.display = 'block';
}

// Muestra el formulario de login y oculta el registro
function mostrarLogin() {
    document.getElementById('form-registro').style.display = 'none';
    document.getElementById('form-login').style.display = 'block';
}

// ── AUTENTICACIÓN ────────────────────────────────────────────

// POST /api/auth/register
// Registra un nuevo usuario
async function register() {
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    if (!nombre || !email || !password) {
        return mostrarMensaje('Todos los campos son obligatorios', true);
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return mostrarMensaje(data.error, true);
        }

        mostrarMensaje('Usuario registrado correctamente. Iniciá sesión.');
        mostrarLogin();

    } catch (error) {
        mostrarMensaje('Error al registrar usuario', true);
    }
}

// POST /api/auth/login
// Inicia sesión y guarda el token en localStorage
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        return mostrarMensaje('Email y contraseña son obligatorios', true);
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return mostrarMensaje(data.error, true);
        }

        // Guardamos el token y datos del usuario en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));

        // Mostramos la sección principal
        mostrarSeccionPrincipal(data.usuario);

    } catch (error) {
        mostrarMensaje('Error al iniciar sesión', true);
    }
}

// Cierra la sesión borrando el token
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    document.getElementById('seccion-auth').style.display = 'block';
    document.getElementById('seccion-principal').style.display = 'none';
}

// Muestra la sección principal después del login
function mostrarSeccionPrincipal(usuario) {
    document.getElementById('seccion-auth').style.display = 'none';
    document.getElementById('seccion-principal').style.display = 'block';
    document.getElementById('usuario-nombre').textContent = `👤 ${usuario.nombre}`;
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
// Carga todos los tickets y los muestra en la tabla
async function cargarTickets() {
    try {
        const response = await fetch(`${API_URL}/tickets`, {
            headers: getHeaders()
        });

        const tickets = await response.json();
        const tbody = document.getElementById('tickets-body');
        tbody.innerHTML = '';

        if (tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No hay tickets todavía</td></tr>';
            return;
        }

        tickets.forEach(ticket => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>#${ticket.id_ticket}</td>
                <td>${ticket.asunto}</td>
                <td>${ticket.categoria}</td>
                <td><span class="estado estado-${ticket.estado}">${ticket.estado}</span></td>
                <td>${ticket.cliente}</td>
                <td>${new Date(ticket.fecha_creacion).toLocaleDateString()}</td>
                <td>
                    <button onclick="eliminarTicket(${ticket.id_ticket})">🗑 Eliminar</button>
                </td>
            `;
            tbody.appendChild(fila);
        });

    } catch (error) {
        mostrarMensaje('Error al cargar tickets', true);
    }
}

// POST /api/tickets
// Crea un nuevo ticket
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

        // Limpiamos el formulario
        document.getElementById('ticket-asunto').value = '';
        document.getElementById('ticket-descripcion').value = '';
        document.getElementById('ticket-categoria').value = '';

        cargarTickets();

    } catch (error) {
        mostrarMensaje('Error al crear ticket', true);
    }
}

// DELETE /api/tickets/:id
// Elimina un ticket
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

    // Si hay token guardado mostramos directo la sección principal
    if (token && usuario) {
        mostrarSeccionPrincipal(usuario);
    }
};