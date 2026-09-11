const SUPABASE_URL = 'https://vzczcyddlyphacplsglu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GTcWstIUeVS2YVQaQEb4Tw_MgXXR4Od';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkExistingSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.href = 'admin.html';
    }
}

checkExistingSession();

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.innerHTML = '';
    }

    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logowanie...';
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        if (errorEl) {
            errorEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Błędny e-mail lub hasło.';
            errorEl.style.display = 'flex';
        }
        console.error(error);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
        return;
    }

    window.location.href = 'admin.html';
});