const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // --- CONTROL DE ACCESO ---
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    loadUserProfile();

    document.getElementById('userProfileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('userPasswordForm').addEventListener('submit', handlePasswordUpdate);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

// --- OBTENER PERFIL (GET /api/auth/me) ---
async function loadUserProfile() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al recuperar el perfil.');

        // Desempaquetamos la propiedad .data que exige el backend
        const user = result.data || result;

        document.getElementById('navUserName').textContent = user.full_name;
        document.getElementById('cardFullName').textContent = user.full_name;
        document.getElementById('infoEmail').textContent = user.email;
        
        // Manejo de fecha de nacimiento nativa de la base de datos (birth_date o fecha_nacimiento)
        const rawDate = user.birth_date || user.fecha_nacimiento || '';
        const cleanDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        document.getElementById('infoBirth').textContent = cleanDate ? formatDate(cleanDate) : 'No registrada';
        
        // Mapeo adaptado a la estructura "metadata" u "otros" del backend
        const favSport = user.metadata?.favorite_sport || user.otros?.deporte || 'No especificado';
        document.getElementById('infoSport').textContent = favSport;

        // Renderizado del badge por rol exigido en la pauta
        const badge = document.getElementById('userBadge');
        badge.textContent = user.role;

        // Rellenar formulario
        document.getElementById('userFormName').value = user.full_name;
        document.getElementById('userFormEmail').value = user.email; 
        document.getElementById('userFormBirth').value = cleanDate;
        document.getElementById('userFormSport').value = favSport === 'No especificado' ? '' : favSport;

    } catch (error) {
        showFeedback(error.message, 'danger');
    }
}

// --- ACTUALIZAR DATOS (PUT /api/auth/me) ---
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('userFormName');
    const birthInput = document.getElementById('userFormBirth');
    const sportInput = document.getElementById('userFormSport');

    nameInput.classList.remove('is-invalid');
    birthInput.classList.remove('is-invalid');
    sportInput.classList.remove('is-invalid');

    let hasError = false;

    if (!nameInput.value.trim()) { nameInput.classList.add('is-invalid'); hasError = true; }
    if (!birthInput.value) { birthInput.classList.add('is-invalid'); hasError = true; }
    if (!sportInput.value.trim()) { sportInput.classList.add('is-invalid'); hasError = true; }

    if (hasError) return;

    const token = localStorage.getItem('token');

    // Adaptamos el body para que mande ambos formatos por si tu backend usa metadata u otros
    const updateData = {
        full_name: nameInput.value.trim(),
        birth_date: birthInput.value,
        fecha_nacimiento: birthInput.value,
        metadata: { favorite_sport: sportInput.value.trim() },
        otros: { practica_deporte: true, deporte: sportInput.value.trim() }
    };

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al actualizar.');

        showFeedback('¡Perfil actualizado con éxito!', 'success');
        loadUserProfile();

    } catch (error) {
        showFeedback(error.message, 'danger');
    }
}

// --- CAMBIAR CONTRASEÑA (PUT /api/auth/me/password) ---
async function handlePasswordUpdate(e) {
    e.preventDefault();

    const currentPass = document.getElementById('userCurrentPass');
    const newPass = document.getElementById('userNewPass');
    const confirmNewPass = document.getElementById('userConfirmNewPass');

    currentPass.classList.remove('is-invalid');
    newPass.classList.remove('is-invalid');
    confirmNewPass.classList.remove('is-invalid');

    let hasError = false;

    if (!currentPass.value) { currentPass.classList.add('is-invalid'); hasError = true; }
    if (!newPass.value || newPass.value.length < 8) { newPass.classList.add('is-invalid'); hasError = true; }
    if (newPass.value !== confirmNewPass.value) { confirmNewPass.classList.add('is-invalid'); hasError = true; }

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

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'La contraseña actual no coincide.');

        showFeedback('Contraseña modificada correctamente.', 'success');
        document.getElementById('userPasswordForm').reset();

    } catch (error) {
        showFeedback(error.message, 'danger');
    }
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // dd/mm/yyyy exigido por pauta
}

function showFeedback(message, type) {
    const alertBox = document.getElementById('userAlert');
    alertBox.className = `alert alert-${type} text-center fw-semibold rounded-3 py-2 small shadow-sm`;
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');
    setTimeout(() => alertBox.classList.add('d-none'), 4000);
}