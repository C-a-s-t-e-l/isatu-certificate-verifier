  /* https://www.youtube.com/watch?v=dQw4w9WgXcQ

  https://www.youtube.com/watch?v=dQw4w9WgXcQ

  https://www.youtube.com/watch?v=dQw4w9WgXcQ  */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loginBtn = document.getElementById('login-btn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        errorMessage.classList.add('hidden');

        const { error } = await supabase.auth.signInWithPassword({
            email: emailInput.value.trim(),
            password: passwordInput.value,
        });

        if (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        } else {
            window.location.href = '/admin.html'; 
        }
    });
});