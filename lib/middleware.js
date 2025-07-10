import { supabase } from './supabaseClient.js';

(async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error getting session:', error.message);
            // Redirect to sign-in even if there's an error getting the session
            window.location.href = '../auth/sign-in/'; 
            return;
        }

        if (!session) {
            console.log('No active session. Redirecting to sign-in.');
            // If no session is found, redirect to the sign-in page
            window.location.href = '../auth/sign-in/';
        } else {
            console.log('Active session found. User is authenticated.');
            // If a session exists, the user can stay on the page
        }
    } catch (error) {
        console.error('An unexpected error occurred in middleware:', error);
        // Redirect to sign-in on any unexpected errors
        window.location.href = '../auth/sign-in/';
    }
})();
