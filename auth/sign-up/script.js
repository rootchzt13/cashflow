import { supabase } from '../../lib/supabaseClient.js';

const signUpForm = document.getElementById('signUpForm');
const submitButton = signUpForm.querySelector('.submit-btn');

signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `Tunggu sebentar<span class="loading-dots"><span></span><span></span><span></span></span>`;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
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
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.error('Error signing up:', error);
            
            let toastMessage = `Error signing up: ${error.message}`;
            // Provide a more user-friendly message if the user already exists and is confirmed.
            // Making the check case-insensitive to be more robust.
            if (error.message.toLowerCase().includes('user already registered')) {
                toastMessage = 'This email is already registered. Please sign in instead.';
            }

            Toastify({
                text: toastMessage,
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

        console.log('User sign up action processed:', data);

        Toastify({
            text: `Confirmation email sent to ${email}. Please check your inbox to complete registration.`,
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
        
        // Redirect to sign-in page after a short delay
        setTimeout(() => {
            window.location.href = '../sign-in/index.html';
        }, 5000);

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
