const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // --- SEGURIDAD Y CONTROL DE ACCESO ---
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'coach') {
        window.location.href = 'login.html';
        return;
    }

    // Cargar perfil actual del Coach de la API
    loadCoachProfile();

    // Selectores del DOM para alternar la vista del Perfil
    const btnVerPerfil = document.getElementById('btnVerPerfil');
    const btnCerrarPerfil = document.getElementById('btnCerrarPerfil');
    const perfilContainer = document.getElementById('perfilContainer');

    btnVerPerfil.addEventListener('click', () => {
        perfilContainer.classList.toggle('d-none');
    });

    btnCerrarPerfil.addEventListener('click', () => {
        perfilContainer.classList.add('d-none');
    });

    // Listeners de Formularios y Cierre de Sesión
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordUpdate);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

// --- CONSUMO DE API: CARGAR PERFIL (GET /api/auth/me) ---
async function loadCoachProfile() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar datos del perfil.');

        const coach = await response.json();

        // Renderizar datos en la UI
        document.getElementById('coachName').textContent = coach.full_name;
        document.getElementById('profName').value = coach.full_name;
        document.getElementById('profEmail').value = coach.email;

    } catch (error) {
        showFeedback(error.message, 'danger');
    }
}

// --- CONSUMO DE API: ACTUALIZAR DATOS PERSONALES (PUT /api/auth/me) ---
async function handleProfileUpdate(e) {
    e.preventDefault();
    const nameInput = document.getElementById('profName');
    nameInput.classList.remove('is-invalid');

    if (!nameInput.value.trim()) {
        nameInput.classList.add('is-invalid');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                full_name: nameInput.value.trim()
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al actualizar el perfil.');

        showFeedback('Perfil actualizado correctamente.', 'success');
        document.getElementById('coachName').textContent = nameInput.value.trim();
        document.getElementById('perfilContainer').classList.add('d-none');

    } catch (error) {
        showFeedback(error.message, 'danger');
    }
}

// --- CONSUMO DE API: CAMBIAR CONTRASEÑA (PUT /api/auth/me/password) ---
async function handlePasswordUpdate(e) {
    e.preventDefault();
    
    const currentPass = document.getElementById('currentPassword');
    const newPass = document.getElementById('newPassword');
    const confirmNewPass = document.getElementById('confirmNewPassword');

    // Limpiar errores visuales
    currentPass.classList.remove('is-invalid');
    newPass.classList.remove('is-invalid');
    confirmNewPass.classList.remove('is-invalid');

    let hasError = false;

    if (!currentPass.value) {
        currentPass.classList.add('is-invalid');
        hasError = true;
    }
    if (!newPass.value || newPass.value.length < 8) {
        newPass.classList.add('is-invalid');
        hasError = true;
    }
    if (newPass.value !== confirmNewPass.value) {
        confirmNewPass.classList.add('is-invalid');
        hasError = true;
    }

    if (hasError) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/auth/me/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                current_password: currentPass.value,
                new_password: newPass.value
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Contraseña actual incorrecta.');

        showFeedback('Contraseña modificada exitosamente.', 'success');
        document.getElementById('passwordForm').reset();
        document.getElementById('perfilContainer').classList.add('d-none');

    } catch (error) {
        showFeedback(error.message, 'danger');
    }
}

// --- LOGOUT ---
function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// --- MOSTRAR FEEDBACK EN UI ---
function showFeedback(message, type) {
    const alertBox = document.getElementById('profileAlert');
    alertBox.className = `alert alert-${type} text-center fw-semibold rounded-3 py-2 small shadow-sm`;
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');

    setTimeout(() => {
        alertBox.classList.add('d-none');
    }, 4000);
}