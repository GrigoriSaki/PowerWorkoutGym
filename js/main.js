const SUPABASE_URL = 'https://vzczcyddlyphacplsglu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GTcWstIUeVS2YVQaQEb4Tw_MgXXR4Od';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allMembers = [];
let editingMemberId = null;

// logout functionality
const logoutBtn = document.querySelector('.logout-btn');
logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await supabaseClient.auth.signOut();

    window.location.href = '/login.html';

})

// delete member from database
async function deleteMember(memberId) {
    if (!confirm('Are you sure you want to delete this member?')) return;

    //delete all passes of member
    const { error: passError } = await supabaseClient
        .from('passes')
        .delete()
        .eq('customer_id', memberId);

    if (passError) {
        console.error("Error deleting passes", passError);
        return;
    }

    // delete member from database
    const { error: memberError } = await supabaseClient
        .from('members')
        .delete()
        .eq('id', memberId);

    if (memberError) {
        console.error("Error deleting member", memberError);
        alert('Failed to delete member.');
        return;
    }

    loadMembers();
}


// load members from database
async function loadMembers() {
    const { data: members, error } = await supabaseClient
        .from('members')
        .select(`*,
      passes( id, pass_type, expiry_date )`);

    if (error) {
        console.error(error);
        return;
    }

    allMembers = members;
    renderMembers(allMembers);
    updateStats(allMembers);
}

// open modal in Add mode
function openAddModal() {
    editingMemberId = null;
    const addMemberForm = document.getElementById('addMemberForm');
    if (addMemberForm) addMemberForm.reset();

    const titleEl = document.getElementById('modalTitle');
    const subtitleEl = document.getElementById('modalSubTitle');
    const iconEl = document.getElementById('modalIcon');
    const btnTextEl = document.getElementById('saveBtnText');

    if (titleEl) titleEl.textContent = 'Add New Member';
    if (subtitleEl) subtitleEl.textContent = 'Enter member details to create a new gym registration.';
    if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-user-plus"></i>';
    if (btnTextEl) btnTextEl.textContent = 'Save Member';

    const addMemberModal = document.getElementById('addMemberModal');
    if (addMemberModal) addMemberModal.showModal();
}

// open modal in Edit mode with populated data
function openEditModal(memberId) {
    const member = allMembers.find(m => String(m.id) === String(memberId));
    if (!member) return;

    editingMemberId = member.id;

    document.getElementById('memberName').value = member.name || '';
    document.getElementById('memberPhone').value = member.phone || '';

    const lastPass = (member.passes && member.passes.length > 0)
        ? [...member.passes].sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))[0]
        : null;

    if (lastPass) {
        document.getElementById('passType').value = lastPass.pass_type || '';
        document.getElementById('passExpiry').value = lastPass.expiry_date || '';
    } else {
        document.getElementById('passType').value = '';
        document.getElementById('passExpiry').value = '';
    }

    const titleEl = document.getElementById('modalTitle');
    const subtitleEl = document.getElementById('modalSubTitle');
    const iconEl = document.getElementById('modalIcon');
    const btnTextEl = document.getElementById('saveBtnText');

    if (titleEl) titleEl.textContent = 'Edit Member';
    if (subtitleEl) subtitleEl.textContent = 'Update member details and membership expiration.';
    if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-user-pen"></i>';
    if (btnTextEl) btnTextEl.textContent = 'Update Member';

    const addMemberModal = document.getElementById('addMemberModal');
    if (addMemberModal) addMemberModal.showModal();
}

// render members in table
function renderMembers(membersList) {
    const tbody = document.getElementById('members-table-body');
    tbody.innerHTML = '';

    membersList.forEach(member => {
        const row = document.createElement('tr');
        row.dataset.id = member.id;
        const lastPass = (member.passes && member.passes.length > 0)
            ? [...member.passes].sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))[0]
            : null;

        const expiryDate = lastPass ? lastPass.expiry_date : '-';
        const passType = lastPass ? (lastPass.pass_type ?? '-') : '-';

        row.innerHTML = `
      <td>
        <div class="member-profile">
          <div class="avatar">${member.name ? member.name.charAt(0).toUpperCase() : '?'}</div>
          <span class="member-name">${member.name}</span>
        </div>
      </td>
      <td><span class="phone-tag"><i class="fa-solid fa-phone"></i> ${member.phone}</span></td>
      <td><span class="membership-badge">${passType}</span></td>
      <td>${expiryDate}</td>
      <td>${lastPass ? getStatusBadge(lastPass.expiry_date) : '-'}</td>
      <td class="text-right">
        <div class="action-buttons">
          <button class="icon-btn edit-btn" title="Edit Member"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="icon-btn delete-btn" title="Delete Member"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
        tbody.appendChild(row);
    });
    document.getElementById('showingCount').textContent = membersList.length;
}

// get pass status type of member based on expiry date
function getStatusType(expiryDate) {
    if (!expiryDate || expiryDate === '-') return '';
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'expired';
    if (daysLeft < 7) return 'warning';
    return 'active';
}

// get pass status badge of member based on status type above
function getStatusBadge(expiryDate) {
    const type = getStatusType(expiryDate);

    if (type === 'expired') {
        return `<span class="status-badge status-expired"><span class="pulse-dot"></span> Expired</span>`;
    } else if (type === 'warning') {
        return `<span class="status-badge status-warning"><span class="pulse-dot"></span> Almost Expired</span>`;
    } else {
        return `<span class="status-badge status-active"> Active</span>`;
    }
}

// Update statistics on the top of the page
function updateStats(membersList) {
    let activeCount = 0;
    let warningCount = 0;
    let expiredCount = 0;

    membersList.forEach(member => {
        const lastPass = member.passes && member.passes.length > 0
            ? [...member.passes].sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))[0]
            : null;

        if (!lastPass) return;

        const status = getStatusType(lastPass.expiry_date);
        if (status === 'active') activeCount++;
        else if (status === 'warning') warningCount++;
        else if (status === 'expired') expiredCount++;
    });

    document.querySelector('#totalCount').textContent = membersList.length;
    document.querySelector('#statTotal').textContent = membersList.length;
    document.getElementById('statActive').textContent = activeCount;
    document.getElementById('statWarning').textContent = warningCount;
    document.getElementById('statExpired').textContent = expiredCount;
}

loadMembers();

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const addMemberBtn = document.getElementById('addMemberBtn');
    const addMemberForm = document.getElementById('addMemberForm');
    const addMemberModal = document.getElementById('addMemberModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeModalIconBtn = document.getElementById('closeModalIconBtn');
    const passType = document.getElementById('passType');

    // Filter table function
    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedStatus = statusFilter.value;

        const filtered = allMembers.filter(member => {
            const lastPass = member.passes && member.passes.length > 0
                ? [...member.passes].sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))[0]
                : null;
            const matchesSearch = member.name.toLowerCase().includes(searchTerm)
                || member.phone.toLowerCase().includes(searchTerm);

            const statusType = lastPass ? getStatusType(lastPass.expiry_date) : '';
            const matchesStatus = selectedStatus === 'all' || statusType === selectedStatus;
            return matchesSearch && matchesStatus;
        });

        renderMembers(filtered);
    }

    // Calculate expiry date based on pass type
    function calculateExpiryDate(passTypeVal) {
        const today = new Date();
        const result = new Date(today);

        if (passTypeVal === 'week') {
            result.setDate(result.getDate() + 7);
        } else if (passTypeVal === 'month') {
            result.setMonth(result.getMonth() + 1);
        } else if (passTypeVal === '2months') {
            result.setMonth(result.getMonth() + 2);
        } else if (passTypeVal === 'year') {
            result.setMonth(result.getMonth() + 12);
        }

        return result;
    }

    // Handle form submission for both add and edit
    async function handleSaveMember(e) {
        e.preventDefault();

        const name = document.getElementById('memberName').value.trim();
        const phone = document.getElementById('memberPhone').value.trim()
            .replace(/[^\d+]/g, "");
        const passTypeValue = document.getElementById('passType').value;
        const passExpiryValue = document.getElementById('passExpiry').value;

        const phoneRegex = /^\+\d{8,15}$/;
        if (!phoneRegex.test(phone)) {
            const message = document.getElementById("phoneMessage");
            message.className = "phone-validation-message error";
            message.textContent =
                "Gebruik een internationaal nummer, bijvoorbeeld +31612345678";
            message.style.display = "block";
            return;
        }

        const existingPhone = allMembers.some(m => m.phone === phone);

        if (existingPhone) {
            const message = document.getElementById("phoneMessage");
            message.className = "phone-validation-message error";
            message.textContent =
                "Dit telefoonnummer is al geregistreerd in het systeem.";
            message.style.display = "block";
            return;
        }

        if (!name || !phone || !passTypeValue || !passExpiryValue)
            return;

        if (editingMemberId) {
            // Update member details
            const { error: memberError } = await supabaseClient
                .from('members')
                .update({ name: name, phone: phone })
                .eq('id', editingMemberId);

            if (memberError) {
                console.error("Error updating member", memberError);
                return;
            }

            // Update pass
            const member = allMembers.find(m => String(m.id) === String(editingMemberId));
            const lastPass = (member && member.passes && member.passes.length > 0)
                ? [...member.passes].sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))[0]
                : null;

            if (lastPass) {
                const { error: passError } = await supabaseClient
                    .from('passes')
                    .update({
                        pass_type: passTypeValue,
                        expiry_date: passExpiryValue
                    })
                    .eq('id', lastPass.id);

                if (passError) console.error("Error updating pass", passError);
            } else {
                const { error: passError } = await supabaseClient
                    .from('passes')
                    .insert({
                        customer_id: editingMemberId,
                        pass_type: passTypeValue,
                        start_date: new Date().toISOString().split('T')[0],
                        expiry_date: passExpiryValue
                    });

                if (passError) console.error("Error creating pass", passError);
            }

            closeModal();
            loadMembers();
        } else {
            // Insert new member
            const { data: newMember, error: memberError } = await supabaseClient
                .from('members')
                .insert({ name: name, phone: phone })
                .select()
                .single();

            if (memberError) {
                console.error("Error creating member", memberError);
                return;
            }

            const { error: passError } = await supabaseClient
                .from('passes')
                .insert({
                    customer_id: newMember.id,
                    pass_type: passTypeValue,
                    start_date: new Date().toISOString().split('T')[0],
                    expiry_date: passExpiryValue
                });

            if (passError) {
                console.error("Error creating pass", passError);
                return;
            }

            closeModal();
            loadMembers();
        }
    }

    const closeModal = () => {
        if (addMemberModal) addMemberModal.close();
        editingMemberId = null;
    };

    // Event Listeners
    if (searchInput) searchInput.addEventListener('input', filterTable);
    if (statusFilter) statusFilter.addEventListener('change', filterTable);
    if (passType) {
        passType.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            const proposedDate = calculateExpiryDate(selectedType);
            document.getElementById('passExpiry').value = proposedDate.toISOString().split('T')[0];
        });
    }

    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', openAddModal);
    }

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (closeModalIconBtn) closeModalIconBtn.addEventListener('click', closeModal);
    if (addMemberForm) addMemberForm.addEventListener('submit', handleSaveMember);

    // Event Delegation for table edit & delete buttons
    const tbody = document.getElementById('members-table-body');
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const row = e.target.closest('tr');
            if (!row) return;

            const memberId = row.dataset.id;

            if (editBtn) {
                openEditModal(memberId);
            } else if (deleteBtn) {
                deleteMember(memberId);
            }
        });
    }
});
