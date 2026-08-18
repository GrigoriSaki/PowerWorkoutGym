const SUPABASE_URL = 'https://vzczcyddlyphacplsglu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GTcWstIUeVS2YVQaQEb4Tw_MgXXR4Od';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allMembers = [];
const passType = document.getElementById('passType');

// load members from database
async function loadMembers() {
    const { data: members, error } = await supabaseClient
        .from('members')
        .select(`*,
      passes( pass_type, expiry_date )`);

    if (error) {
        console.error(error);
        return;
    }

    allMembers = members;
    renderMembers(allMembers);
    updateStats(allMembers);
}

// render members in table
function renderMembers(membersList) {
    const tbody = document.getElementById('members-table-body');
    tbody.innerHTML = '';

    membersList.forEach(member => {
        const row = document.createElement('tr');
        row.dataset.id = member.id;
        const lastPass = member.passes.sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))[0];
        row.innerHTML = `
      <td>
        <div class="member-profile">
          <div class="avatar">${member.name.charAt(0)}</div>
          <span class="member-name">${member.name}</span>
        </div>
      </td>
      <td><span class="phone-tag"><i class="fa-solid fa-phone"></i> ${member.phone}</span></td>
      <td><span class="membership-badge">${lastPass.pass_type ?? ''}</span></td>
      <td>${lastPass.expiry_date}</td>
      <td>${getStatusBadge(lastPass.expiry_date)}</td>
      <td class="text-right">
        <div class="action-buttons">
          <button class="icon-btn renew-btn" title="Renew Membership"><i class="fa-solid fa-arrows-rotate"></i></button>
          <button class="icon-btn edit-btn" title="Edit Member"><i class="fa-solid fa-pen-to-square"></i></button>
        </div>
      </td>
    `;
        tbody.appendChild(row);
    });
    document.getElementById('showingCount').textContent = membersList.length;
}

// get pass status type of member based on expiry date
function getStatusType(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 7) return 'warning';
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

//Update statistics on the top of the page
function updateStats(membersList) {
    let activeCount = 0;
    let warningCount = 0;
    let expiredCount = 0;

    membersList.forEach(member => {
        const lastPass = member.passes.length > 0
            ? member.passes.sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))[0]
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
    const tableRows = document.querySelectorAll('#membersTable tbody tr');
    const showingCount = document.getElementById('showingCount');
    const addMemberBtn = document.getElementById('addMemberBtn');

    // Filter table function
    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedStatus = statusFilter.value;

        const filtered = allMembers.filter(member => {
            const lastPass = member.passes.length > 0
                ? member.passes.sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))[0]
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
    function calculateExpiryDate(passType) {
        const today = new Date();
        const result = new Date(today);

        if (passType === 'week') {
            result.setDate(result.getDate() + 7);
        } else if (passType === 'month') {
            result.setMonth(result.getMonth() + 1);
        } else if (passType === '2months') {
            result.setMonth(result.getMonth() + 2);
        } else if (passType === 'year') {
            result.setMonth(result.getMonth() + 12);
        }

        return result;
    }


    // Event Listeners
    if (searchInput) searchInput.addEventListener('input', filterTable);
    if (statusFilter) statusFilter.addEventListener('change', filterTable);
    passType.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        const proposedDate = calculateExpiryDate(selectedType);
        document.getElementById('passExpiry').value = proposedDate.toISOString().split('T')[0];
    })


    // Button Click Actions
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            addMemberModal.showModal();
        });
    }

    const addMemberModal = document.getElementById('addMemberModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeModalIconBtn = document.getElementById('closeModalIconBtn');

    const closeModal = () => {
        if (addMemberModal) addMemberModal.close();
    };

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (closeModalIconBtn) closeModalIconBtn.addEventListener('click', closeModal);


    // Attach row button click handlers
    document.querySelectorAll('.renew-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const name = row?.querySelector('.member-name')?.textContent || 'Member';
            alert(`Renewing membership for ${name}...`);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const name = row?.querySelector('.member-name')?.textContent || 'Member';
            alert(`Editing details for ${name}...`);
        });
    });
});
