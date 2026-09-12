const SUPABASE_URL = 'https://vzczcyddlyphacplsglu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GTcWstIUeVS2YVQaQEb4Tw_MgXXR4Od';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const hamburgerBtn = document.getElementById('hamburgerBtn');
const navMenu = document.getElementById('navMenu');

hamburgerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

document.getElementById("passCheckForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const phoneNumber = document.getElementById("phoneNumber").value.trim()
        .replace(/[^\d+]/g, "");
    const result = document.getElementById("result");
    const phoneRegex = /^\+\d{8,15}$/;
    if (phoneNumber === "") {
        result.innerHTML = "Voer een telefoonnummer in.";
        return;
    }

    if (!phoneRegex.test(phoneNumber)) {
        result.innerHTML = "Voer de gegevens in het juiste formaat in (e.g. +31612345678).";
        return;
    }

    const { data, error } = await supabaseClient
        .from('members')
        .select(`
        passes (
            expiry_date
        )
    `)
        .eq('phone', phoneNumber)
        .single();

    if (error || !data || !data.passes.length) {
        result.innerHTML = "Geen lid gevonden.";
        return;
    }

    result.innerHTML =
        `Je abonnement is geldig tot:
    <strong>${data.passes[0].expiry_date}</strong>`;


})