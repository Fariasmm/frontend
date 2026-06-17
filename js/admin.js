const API_URL = 'http://localhost:3000/api';
let userModal;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    userModal = new bootstrap.Modal(document.getElementById('userModal'));
    loadUsers();

    document.getElementById('btnNuevoUsuario').addEventListener('click', openCreateModal);
    document.getElementById('userForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

// 🛠️ FUNCIÓN AGREGADA: Controla la apertura limpia para crear un usuario nuevo
function openCreateModal() {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = ''; // Asegura que quede vacío para que sea un POST
    document.getElementById('userModalLabel').textContent = 'Nuevo Usuario';
    document.getElementById('passwordSection').classList.remove('d-none'); // Muestra contraseñas
    clearValidationStates();
    if (userModal) userModal.show();
}

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al obtener usuarios.');

        renderUsersTable(result.data || result);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error: ${error.message}</td></tr>`;
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    if (!Array.isArray(users) || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No hay usuarios registrados.</td></tr>';
        return;
    }

    users.forEach(user => {
        const tr = document.createElement('tr');
        const registrationDate = user.createdAt ? formatDate(user.createdAt) : '17/06/2026';

        let badgeColor = 'bg-success';
        if (user.role === 'admin') badgeColor = 'bg-danger';
        if (user.role === 'coach') badgeColor = 'bg-primary';

        tr.innerHTML = `
            <td class="fw-semibold">#${user.id}</td>
            <td>${user.full_name || 'Sin Nombre'}</td>
            <td>${user.email}</td>
            <td><span class="badge ${badgeColor}">${user.role}</span></td>
            <td>${registrationDate}</td>
            <td class="text-center">
                <div class="btn-group gap-2">
                    <button class="btn btn-warning btn-sm rounded-2 text-dark btn-editar" data-id="${user.id}">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-danger btn-sm rounded-2 btn-eliminar" data-id="${user.id}">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </div>
            </td>
        `;

        tr.querySelector('.btn-editar').addEventListener('click', () => openEditModal(user.id));
        tr.querySelector('.btn-eliminar').addEventListener('click', () => deleteUser(user.id));

        tbody.appendChild(tr);
    });
}

async function openEditModal(id) {
    document.getElementById('userForm').reset();
    clearValidationStates();
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al recuperar detalles.');
        
        const user = result.data || result;
        
        document.getElementById('userId').value = user.id;
        document.getElementById('modalFullName').value = user.full_name;
        document.getElementById('modalEmail').value = user.email;
        document.getElementById('modalRole').value = user.role;
        
        document.getElementById('passwordSection').classList.add('d-none'); // Oculta contraseñas al editar
        document.getElementById('userModalLabel').textContent = `Editar Usuario #${user.id}`;
        userModal.show();

    } catch (error) {
        showFeedback(error.message, 'danger');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    clearValidationStates();

    const id = document.getElementById('userId').value.trim(); // Limpiamos espacios
    const fullNameInput = document.getElementById('modalFullName');
    const emailInput = document.getElementById('modalEmail');
    const roleSelect = document.getElementById('modalRole');
    const passwordInput = document.getElementById('modalPassword');
    const confirmPasswordInput = document.getElementById('modalConfirmPassword');

    let hasError = false;

    if (!fullNameInput.value.trim()) { fullNameInput.classList.add('is-invalid'); hasError = true; }
    if (!emailInput.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) { emailInput.classList.add('is-invalid'); hasError = true; }

    // Validación corregida: Solo pide contraseña si NO hay un ID presente (Crear nuevo)
    const isEdit = id !== ''; 

    if (!isEdit) {
        if (!passwordInput.value || passwordInput.value.length < 8) { passwordInput.classList.add('is-invalid'); hasError = true; }
        if (passwordInput.value !== confirmPasswordInput.value) { confirmPasswordInput.classList.add('is-invalid'); hasError = true; }
    }

    if (hasError) return;

    const token = localStorage.getItem('token');
    const url = isEdit ? `${API_URL}/users/${id}` : `${API_URL}/users`;
    const method = isEdit ? 'PUT' : 'POST';

    const bodyData = {
        full_name: fullNameInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        role: roleSelect.value
    };

    if (!isEdit) {
        bodyData.password = passwordInput.value;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bodyData)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al guardar.');

        userModal.hide();
        showFeedback(isEdit ? '¡Usuario actualizado con éxito!' : '¡Usuario creado con éxito!', 'success');
        loadUsers();

    } catch (error) {
        showFeedback(error.message, 'danger');
    }
}

async function deleteUser(id) {
    if (!confirm('¿Deseas eliminar este usuario?')) return;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al eliminar.');

        showFeedback('Usuario eliminado correctamente.', 'success');
        loadUsers();

    } catch (error) {
        showFeedback(error.message, 'danger');
    }
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function showFeedback(message, type) {
    const alertBox = document.getElementById('crudAlert');
    if (alertBox) {
        alertBox.className = `alert alert-${type} text-center fw-semibold rounded-3 py-2 small shadow-sm`;
        alertBox.textContent = message;
        alertBox.classList.remove('d-none');
        setTimeout(() => alertBox.classList.add('d-none'), 4000);
    }
}

function clearValidationStates() {
    document.querySelectorAll('.form-control, .form-select').forEach(c => c.classList.remove('is-invalid'));
}