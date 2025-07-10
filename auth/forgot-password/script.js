import { supabase } from '../../lib/supabaseClient.js';

const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const submitButton = forgotPasswordForm.querySelector('.submit-btn');

forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `Tunggu sebentar<span class="loading-dots"><span></span><span></span><span></span></span>`;

    const email = document.getElementById('email').value;

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/create-new-password/`,
        });

        if (error) {
            console.error('Error sending password reset email:', error.message);
            Toastify({
                text: `Error: ${error.message}`,
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
            text: "A password reset link has been sent to your email address.",
            duration: 5000,
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
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
});
