import { supabase } from '../../lib/supabaseClient.js';

const resetPasswordForm = document.getElementById('resetPasswordForm');
const submitButton = resetPasswordForm.querySelector('.submit-btn');
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
let originalButtonText = 'Atur Kata Sandi Baru';

function showToast(message, isError = false) {
    const style = {
        background: isError 
            ? "rgba(207, 102, 121, 0.8)" 
            : "rgba(3, 218, 198, 0.8)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "8px"
    };
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "center",
        style: style
    }).showToast();
}

function setFormState(enabled, message = '') {
    submitButton.disabled = !enabled;
    newPasswordInput.disabled = !enabled;
    confirmNewPasswordInput.disabled = !enabled;
    if (message) {
        submitButton.innerHTML = message;
    }
}

// 1. Initially disable the form
setFormState(false, `Mengesahkan...<span class="loading-dots"><span></span><span></span><span></span></span>`);

// 2. Listen for the PASSWORD_RECOVERY event
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        showToast("Authentication successful. You can now set a new password.");
        setFormState(true, originalButtonText);
    }
});

// 3. Add form submission logic
resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormState(false, `Tunggu sebentar<span class="loading-dots"><span></span><span></span><span></span></span>`);

    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;

    if (newPassword.length < 6) {
        showToast("Password should be at least 6 characters.", true);
        setFormState(true, originalButtonText);
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showToast("Passwords do not match.", true);
        setFormState(true, originalButtonText);
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            throw error;
        }

        showToast("Your password has been reset successfully. Redirecting...");
        
        setTimeout(() => {
            window.location.href = '../sign-in/';
        }, 3000);

    } catch (error) {
        console.error('Error resetting password:', error);
        showToast(`Error: ${error.message}`, true);
        setFormState(true, originalButtonText);
    }
});
