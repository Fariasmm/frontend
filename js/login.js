const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            // Detiene por completo la recarga automática de la página
            e.preventDefault();
            resetErrors();

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const generalError = document.getElementById('generalError');

            const email = emailInput.value.trim();
            const password = passwordInput.value;
            let hasError = false;

            // Validaciones locales obligatorias (Rúbrica exige no usar alert)
            if (!email) {
                emailInput.classList.add('is-invalid');
                document.getElementById('emailError').textContent = 'El email es obligatorio.';
                hasError = true;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                emailInput.classList.add('is-invalid');
                document.getElementById('emailError').textContent = 'El formato de email no es válido.';
                hasError = true;
            }

            if (!password) {
                passwordInput.classList.add('is-invalid');
                hasError = true;
            }

            if (hasError) return;

            // Consumo de la API con Fetch apuntando al backend real
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Error de autenticación. Verifica tus datos.');
                }

                // Guardar la sesión en localStorage leyendo la envoltura .data del backend
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('userRole', result.data.user.role);

                // Redirección dinámica según el rol del usuario
                if (result.data.user.role === 'admin') {
                    window.location.href = 'dashboard-admin.html';
                } else if (result.data.user.role === 'coach') {
                    window.location.href = 'dashboard-coach.html';
                } else {
                    window.location.href = 'dashboard-usuario.html';
                }

            } catch (error) {
                if (generalError) {
                    generalError.textContent = error.message;
                    generalError.classList.remove('d-none');
                }
            }
        });
    }
});

function resetErrors() {
    document.getElementById('email').classList.remove('is-invalid');
    document.getElementById('password').classList.remove('is-invalid');
    const generalError = document.getElementById('generalError');
    if (generalError) {
        generalError.classList.add('d-none');
        generalError.textContent = '';
    }
}