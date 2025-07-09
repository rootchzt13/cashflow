import { supabase } from '../../lib/supabaseClient.js';

const signInForm = document.getElementById('signInForm');
const submitButton = signInForm.querySelector('.submit-btn');

signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `Tunggu sebentar<span class="loading-dots"><span></span><span></span><span></span></span>`;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Error signing in:', error.message);
            Toastify({
                text: `Error signing in: ${error.message}`,
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

        console.log('User signed in successfully:', data);
        Toastify({
            text: "Sign in successful! Redirecting...",
            duration: 2000,
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

        // Redirect to the dashboard page upon successful sign-in
        setTimeout(() => {
            window.location.href = '../../dashboard/index.html';
        }, 2000);

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
