const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            resetErrors();

            // Captura de elementos de la interfaz
            const nombre = document.getElementById('nombre');
            const apellido = document.getElementById('apellido');
            const email = document.getElementById('email');
            const fechaNacimiento = document.getElementById('fecha_nacimiento');
            const deporte = document.getElementById('deporte');
            const telefono = document.getElementById('telefono');
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirm-password');

            const errorMsg = document.getElementById('error-msg');
            const successMsg = document.getElementById('success-msg');

            let hasError = false;

            // 1. Validaciones Locales (Rúbrica exige no usar alert y pintar bordes en rojo)
            if (!nombre.value.trim()) {
                nombre.classList.add('is-invalid');
                hasError = true;
            }
            if (!apellido.value.trim()) {
                apellido.classList.add('is-invalid');
                hasError = true;
            }
            if (!email.value.trim()) {
                email.classList.add('is-invalid');
                document.getElementById('emailError').textContent = 'El email es obligatorio.';
                hasError = true;
            } else if (!validateEmail(email.value.trim())) {
                email.classList.add('is-invalid');
                document.getElementById('emailError').textContent = 'El formato de email no es válido.';
                hasError = true;
            }
            if (!fechaNacimiento.value) {
                fechaNacimiento.classList.add('is-invalid');
                hasError = true;
            }
            if (!deporte.value.trim()) {
                deporte.classList.add('is-invalid');
                hasError = true;
            }
            if (!telefono.value.trim()) {
                telefono.classList.add('is-invalid');
                hasError = true;
            }
            if (!password.value) {
                password.classList.add('is-invalid');
                document.getElementById('passwordError').textContent = 'La contraseña es obligatoria.';
                hasError = true;
            } else if (password.value.length < 8) {
                password.classList.add('is-invalid');
                document.getElementById('passwordError').textContent = 'La contraseña debe tener al menos 8 caracteres.';
                hasError = true;
            }
            if (password.value !== confirmPassword.value) {
                confirmPassword.classList.add('is-invalid');
                hasError = true;
            }

            if (hasError) return;

            // Preparación de los datos para la API (Unimos nombre y apellido)
            const userData = {
                full_name: `${nombre.value.trim()} ${apellido.value.trim()}`,
                email: email.value.trim().toLowerCase(),
                password: password.value,
                birth_date: fechaNacimiento.value,
                metadata: {
                    favorite_sport: deporte.value.trim(),
                    phone: `+56${telefono.value.trim()}`
                }
            };

            // 2. Consumo del Endpoint de Registro público
            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Error al procesar el registro.');
                }

                // Guardar la sesión de forma inmediata en el LocalStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.user?.role || 'user');

                // Mostrar éxito antes de saltar al Dashboard
                successMsg.textContent = '¡Cuenta creada! Redireccionando...';
                successMsg.classList.remove('d-none');

                setTimeout(() => {
                    window.location.href = 'dashboard-usuario.html';
                }, 1500);

            } catch (error) {
                errorMsg.textContent = error.message;
                errorMsg.classList.remove('d-none');
            }
        });
    }
});

function resetErrors() {
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => input.classList.remove('is-invalid'));
    
    document.getElementById('error-msg').classList.add('d-none');
    document.getElementById('success-msg').classList.add('d-none');
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}