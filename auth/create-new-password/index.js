import { supabase } from '../../lib/supabaseClient.js';

const resetPasswordForm = document.getElementById('resetPasswordForm');
const submitButton = resetPasswordForm.querySelector('.submit-btn');

resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `Tunggu sebentar<span class="loading-dots"><span></span><span></span><span></span></span>`;

    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        Toastify({
            text: "Passwords do not match.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
                background: "rgba(207, 102, 121, 0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px"
            }
        }).showToast();
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            console.error('Error resetting password:', error.message);
            Toastify({
                text: `Error resetting password: ${error.message}`,
                duration: 3000,
                close: true,
                gravity: "top",
                position: "center",
                style: {
                    background: "rgba(207, 102, 121, 0.8)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px"
                }
            }).showToast();
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            return;
        }

        Toastify({
            text: "Your password has been reset successfully. Redirecting...",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
                background: "rgba(3, 218, 198, 0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px"
            }
        }).showToast();
        
        setTimeout(() => {
            window.location.href = '/sign-in/';
        }, 3000);

    } catch (error) {
        console.error('An unexpected error occurred:', error);
        Toastify({
            text: 'An unexpected error occurred. Please try again.',
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            style: {
                background: "rgba(207, 102, 121, 0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px"
            }
        }).showToast();
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
});

// Handling the session from the magic link
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery event detected.');
        // The user is now signed in, and can update their password.
        // The form submission will handle the password update.
    }
});
