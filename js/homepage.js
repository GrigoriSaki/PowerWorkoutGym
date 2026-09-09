const SUPABASE_URL = 'https://vzczcyddlyphacplsglu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GTcWstIUeVS2YVQaQEb4Tw_MgXXR4Od';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById("passCheckForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const phoneNumber = document.getElementById("phoneNumber").value;
    const result = document.getElementById("result");
    if (phoneNumber === "") {
        result.innerHTML = "Voer een telefoonnummer in.";
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