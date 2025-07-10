import { supabase } from '../lib/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
    const addDataBtn = document.getElementById('addDataBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const modal = document.getElementById('addModal');
    const jumlahInput = document.getElementById('jumlah');
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const labelFilter = document.getElementById('labelFilter');
    const dataListContainer = document.getElementById('dataList');
    const signOutBtn = document.getElementById('signOutBtn');
    const addDataForm = document.getElementById('addDataForm');
    const modalTitle = document.getElementById('modalTitle');
    const submitButton = document.getElementById('submitModalBtn');
    const editIdInput = document.getElementById('editId');
    const labelInput = document.getElementById('label');
    const labelSuggestionsContainer = document.getElementById('label-suggestions-container');
    const typeInput = document.getElementById('type');
    const typeSuggestionsContainer = document.getElementById('type-suggestions-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const labelFilterInput = document.getElementById('labelFilterInput');
    const labelFilterSuggestions = document.getElementById('labelFilterSuggestions');
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalText = document.getElementById('confirmModalText');
    const confirmYesBtn = document.getElementById('confirmYesBtn');
    const confirmNoBtn = document.getElementById('confirmNoBtn');

    let transactions = [];
    let labels = [];
    let page = 0;
    const itemsPerPage = 5;
    let isLoading = false;
    let allDataLoaded = false;
    let isSearching = false;
    let isFiltering = false;
    let confirmCallback = null;

    function showToast(message, type = 'info') {
        const backgroundColor = type === 'error' ? 'linear-gradient(to right, #ff5f6d, #ffc371)' : 'linear-gradient(to right, #00b09b, #96c93d)';
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "center",
            stopOnFocus: true,
            style: {
                background: backgroundColor,
                borderRadius: "10px",
                padding: "1rem",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)"
            },
        }).showToast();
    }

    function showConfirmModal(message, callback) {
        confirmModalText.textContent = message;
        confirmCallback = callback;
        confirmModal.classList.add('active');
    }

    function closeConfirmModal() {
        confirmModal.classList.remove('active');
        confirmCallback = null;
    }

    function updateSummary(data) {
        const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.jumlah, 0);
        const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.jumlah, 0);
        const balance = income - expense;

        const pemasukanEl = document.getElementById('pemasukan');
        const pengeluaranEl = document.getElementById('pengeluaran');
        const penghasilanEl = document.getElementById('penghasilan');

        pemasukanEl.innerHTML = `+ ${formatRupiah(income.toString())}`;
        pemasukanEl.classList.remove('expense');
        pemasukanEl.classList.add('income');

        pengeluaranEl.innerHTML = `- ${formatRupiah(expense.toString())}`;
        pengeluaranEl.classList.remove('income');
        pengeluaranEl.classList.add('expense');

        if (balance >= 0) {
            penghasilanEl.innerHTML = `+ ${formatRupiah(balance.toString())}`;
            penghasilanEl.classList.remove('expense');
            penghasilanEl.classList.add('income');
        } else {
            penghasilanEl.innerHTML = `- ${formatRupiah(Math.abs(balance).toString())}`;
            penghasilanEl.classList.remove('income');
            penghasilanEl.classList.add('expense');
        }
    }

    async function fetchData() {
        const { data, error } = await supabase
            .from('Manager')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching data:', error);
        } else {
            transactions = data;
            applyFilters();
        }
    }

    async function fetchLabels() {
        const { data, error } = await supabase
            .from('LabelList')
            .select('*');

        if (error) {
            console.error('Error fetching labels:', error);
        } else {
            labels = data;
            populateLabels();
        }
    }

    function resetModal() {
        addDataForm.reset();
        editIdInput.value = '';
        modalTitle.textContent = 'Tambah Data Baru';
        submitButton.textContent = 'Simpan';
        labelSuggestionsContainer.style.display = 'none';
        typeSuggestionsContainer.style.display = 'none';
        typeInput.dataset.value = '';
    }

    function toggleModal() {
        modal.classList.toggle('active');
        if (!modal.classList.contains('active')) {
            resetModal();
        }
    }

    function openEditModal(id) {
        const transaction = transactions.find(t => t.id === parseInt(id, 10));
        if (transaction) {
            resetModal();
            modalTitle.textContent = 'Edit Data';
            submitButton.textContent = 'Update';

            // Populate the form fields
            const typeDisplay = transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
            typeInput.value = typeDisplay;
            typeInput.dataset.value = transaction.type;

            document.getElementById('jumlah').value = formatRupiah(transaction.jumlah.toString());
            labelInput.value = transaction.label;
            document.getElementById('catatan').value = transaction.catatan;
            editIdInput.value = transaction.id;

            // Use the correct function to show the modal
            toggleModal();
        }
    }

    const formatRupiah = (angka) => {
        let number_string = angka.replace(/[^,\d]/g, '').toString(),
            split = number_string.split(','),
            sisa = split[0].length % 3,
            rupiah = split[0].substr(0, sisa),
            ribuan = split[0].substr(sisa).match(/\d{3}/gi);

        if (ribuan) {
            let separator = sisa ? '.' : '';
            rupiah += separator + ribuan.join('.');
        }

        rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
        return 'Rp ' + rupiah;
    }

    function unformatRupiah(rupiah) {
        return parseInt(rupiah.replace(/[^,\d]/g, '').toString());
    }

    function renderData(dataToRender = transactions) {
        dataListContainer.innerHTML = '';
        
        // Always calculate totals from the full unfiltered dataset
        let totalPemasukan = 0;
        let totalPengeluaran = 0;
        transactions.forEach(item => {
            if (item.type === 'Pemasukan') {
                totalPemasukan += item.jumlah;
            } else {
                totalPengeluaran += item.jumlah;
            }
        });

        if(dataToRender.length === 0) {
            dataListContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">No transactions yet. Add one to get started!</p>';
        }

        dataToRender.forEach((item) => {
            const originalIndex = transactions.findIndex(d => d.id === item.id);
            const card = document.createElement('div');
            card.className = 'data-card';
            card.dataset.id = item.id;

            const notesHTML = item.catatan ? `<div class="notes">${item.catatan}</div>` : '';
            const actionsMargin = item.catatan ? 'style="margin-top: 0.75rem;"' : '';

            const footerHTML = `
                <div class="data-card-footer">
                    ${notesHTML}
                    <div class="data-card-actions" ${actionsMargin}>
                        <button class="action-btn edit" title="Edit"><i data-feather="edit-2"></i></button>
                        <button class="action-btn delete" title="Delete"><i data-feather="trash-2"></i></button>
                    </div>
                </div>
            `;

            card.innerHTML = `
                <div class="data-card-header">
                    <span class="type">${item.type}</span>
                    <span class="amount ${item.type.toLowerCase()}">${formatRupiah(item.jumlah.toString())}</span>
                </div>
                <div class="data-card-body">
                    <span class="label">${item.label}</span>
                    <span class="date">${new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                ${footerHTML}
            `;

            dataListContainer.appendChild(card);
        });

        feather.replace(); // To render new icons
        
        document.getElementById('pemasukan').textContent = formatRupiah(totalPemasukan.toString());
        document.getElementById('pengeluaran').textContent = formatRupiah(totalPengeluaran.toString());
        document.getElementById('penghasilan').textContent = formatRupiah((totalPemasukan - totalPengeluaran).toString());
    }

    function populateLabels() {
        const labelFilterDropdown = document.getElementById('labelFilter');
        labelFilterDropdown.innerHTML = '<option value="all">Semua Label</option>'; // Clear for filter

        labels.forEach(label => {
            const filterOption = document.createElement('option');
            filterOption.value = label.label_name;
            filterOption.textContent = label.label_name;
            labelFilterDropdown.appendChild(filterOption);
        });
    }

    function renderLabelSuggestions() {
        const inputValue = labelInput.value.toLowerCase().trim();
        const inputRawValue = labelInput.value.trim();
        labelSuggestionsContainer.innerHTML = '';

        // Filter labels based on the input
        const filteredLabels = labels.filter(label =>
            label.label_name.toLowerCase().includes(inputValue)
        );

        // Render the filtered/existing labels
        filteredLabels.forEach(label => {
            const item = document.createElement('div');
            item.classList.add('suggestion-item');
            item.textContent = label.label_name;
            item.addEventListener('click', () => {
                labelInput.value = label.label_name;
                labelSuggestionsContainer.style.display = 'none';
            });
            labelSuggestionsContainer.appendChild(item);
        });

        // Add the "create new" option if the user typed something that isn't an exact match
        if (inputValue) {
            const exactMatch = labels.some(label => label.label_name.toLowerCase() === inputValue);
            if (!exactMatch) {
                const createItem = document.createElement('div');
                createItem.classList.add('suggestion-item', 'create-new');
                createItem.innerHTML = `Tambah label baru: "<strong>${inputRawValue}</strong>"`;
                createItem.addEventListener('click', () => {
                    // The value is already in the input, just hide the container
                    labelSuggestionsContainer.style.display = 'none';
                });
                labelSuggestionsContainer.appendChild(createItem);
            }
        }

        // Show or hide the suggestions container
        if (labelSuggestionsContainer.children.length > 0) {
            labelSuggestionsContainer.style.display = 'block';
        } else {
            labelSuggestionsContainer.style.display = 'none';
        }
    }

    function renderTypeSuggestions() {
        typeSuggestionsContainer.innerHTML = '';
        const typeOptions = [
            { display: 'Pemasukan', value: 'income' },
            { display: 'Pengeluaran', value: 'expense' }
        ];

        typeOptions.forEach(option => {
            const item = document.createElement('div');
            item.classList.add('suggestion-item');
            item.textContent = option.display;
            item.addEventListener('click', () => {
                typeInput.value = option.display;
                typeInput.dataset.value = option.value; // Store the 'income'/'expense' value
                typeSuggestionsContainer.style.display = 'none';
            });
            typeSuggestionsContainer.appendChild(item);
        });

        typeSuggestionsContainer.style.display = 'block';
    }

    addDataForm.addEventListener('submit', async(e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loader"></span> Loading...';

        try {
            const formData = new FormData(addDataForm);
            const jumlah = parseFloat(formData.get('jumlah').replace(/[^0-9]/g, ''));
            const labelName = formData.get('label').trim();
            const catatan = formData.get('catatan').trim();
            const type = typeInput.dataset.value; // Get the stored 'income'/'expense' value
            const id = formData.get('id');

            if (!type) {
                showToast('Error: Tipe transaksi harus dipilih.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = id ? 'Update' : 'Simpan';
                return;
            }

            // If the label is new, add it to the LabelList for future suggestions.
            const existingLabel = labels.find(l => l.label_name.toLowerCase() === labelName.toLowerCase());
            if (!existingLabel && labelName) {
                const { data: newLabel, error: newLabelError } = await supabase
                    .from('LabelList')
                    .insert([{ label_name: labelName, user_id: (await supabase.auth.getUser()).data.user.id }])
                    .select()
                    .single();

                if (newLabelError) throw newLabelError;
                labels.push(newLabel);
            }

            // Save the transaction with the label text, as per the schema.
            const transactionData = {
                type,
                jumlah,
                label: labelName,
                catatan,
                user_id: (await supabase.auth.getUser()).data.user.id
            };

            if (id) {
                const { error } = await supabase.from('Manager').update(transactionData).eq('id', id);
                if (error) throw error;
                showToast('Transaction updated successfully', 'success');
            } else {
                const { error } = await supabase.from('Manager').insert([transactionData]);
                if (error) throw error;
                showToast('Transaction added successfully', 'success');
            }

            toggleModal();
            fetchInitialData();

        } catch (error) {
            console.error('Error handling form submission:', error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = editIdInput.value ? 'Update' : 'Simpan';
        }
    });

    labelInput.addEventListener('input', renderLabelSuggestions);
    labelInput.addEventListener('focus', renderLabelSuggestions);

    typeInput.addEventListener('click', renderTypeSuggestions);

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!labelSuggestionsContainer.contains(e.target) && e.target !== labelInput) {
            labelSuggestionsContainer.style.display = 'none';
        }
        if (!typeSuggestionsContainer.contains(e.target) && e.target !== typeInput) {
            typeSuggestionsContainer.style.display = 'none';
        }
        if (!labelFilterSuggestions.contains(e.target) && e.target !== labelFilterInput) {
            labelFilterSuggestions.style.display = 'none';
        }
    });

    async function filterTransactionsByLabel(label) {
        isFiltering = true;
        allDataLoaded = true; // Disable infinite scroll during filtering
        loadingSpinner.style.display = 'flex';

        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) return;

            const { data, error } = await supabase
                .from('Manager')
                .select('*')
                .eq('user_id', user.data.user.id)
                .eq('label', label)
                .order('created_at', { ascending: false });

            if (error) throw error;
            renderCards(data, false);
            updateSummary(data);
        } catch (error) {
            console.error("Error filtering transactions:", error);
            showToast("Error during filter.", "error");
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    async function deleteTransaction(id) {
        showConfirmModal('Apakah Anda yakin ingin menghapus transaksi ini?', async () => {
            try {
                const { error } = await supabase.from('Manager').delete().eq('id', id);
                if (error) throw error;
                showToast('Transaksi berhasil dihapus', 'success');
                fetchInitialData();
            } catch (error) {
                console.error('Error deleting transaction:', error);
                showToast(`Error: ${error.message}`, 'error');
            }
        });
    }

    async function fetchAndSetTotals() {
        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) return;
            const userId = user.data.user.id;

            // Fetch total income
            const { data: incomeData, error: incomeError } = await supabase
                .from('Manager')
                .select('jumlah')
                .eq('user_id', userId)
                .eq('type', 'income');
            if (incomeError) throw incomeError;
            const income = incomeData.reduce((sum, t) => sum + t.jumlah, 0);

            // Fetch total expense
            const { data: expenseData, error: expenseError } = await supabase
                .from('Manager')
                .select('jumlah')
                .eq('user_id', userId)
                .eq('type', 'expense');
            if (expenseError) throw expenseError;
            const expense = expenseData.reduce((sum, t) => sum + t.jumlah, 0);
            
            const balance = income - expense;

            const pemasukanEl = document.getElementById('pemasukan');
            const pengeluaranEl = document.getElementById('pengeluaran');
            const penghasilanEl = document.getElementById('penghasilan');

            pemasukanEl.innerHTML = `+ ${formatRupiah(income.toString())}`;
            pemasukanEl.classList.remove('expense');
            pemasukanEl.classList.add('income');

            pengeluaranEl.innerHTML = `- ${formatRupiah(expense.toString())}`;
            pengeluaranEl.classList.remove('income');
            pengeluaranEl.classList.add('expense');

            if (balance >= 0) {
                penghasilanEl.innerHTML = `+ ${formatRupiah(balance.toString())}`;
                penghasilanEl.classList.remove('expense');
                penghasilanEl.classList.add('income');
            } else {
                penghasilanEl.innerHTML = `- ${formatRupiah(Math.abs(balance).toString())}`;
                penghasilanEl.classList.remove('income');
                penghasilanEl.classList.add('expense');
            }

        } catch (error) {
            console.error("Error fetching totals:", error);
            showToast("Could not calculate totals.", "error");
            document.getElementById('pemasukan').innerHTML = 'Error';
            document.getElementById('pengeluaran').innerHTML = 'Error';
            document.getElementById('penghasilan').innerHTML = 'Error';
        }
    }


    function renderCards(data, append = false) {
        const cardsContainer = document.getElementById('dataList');
        if (!append) {
            cardsContainer.innerHTML = '';
        }

        if (!append && data.length === 0) {
            cardsContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">No transactions yet. Add one to get started!</p>';
            return;
        }

        data.forEach((item) => {
            const originalIndex = data.findIndex(d => d.id === item.id);
            const card = document.createElement('div');
            card.className = 'data-card';
            card.dataset.id = item.id;

            const notesHTML = item.catatan ? `<div class="notes">${item.catatan}</div>` : '';
            const actionsMargin = item.catatan ? 'style="margin-top: 0.75rem;"' : '';

            const typeDisplay = item.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
            const amountColorClass = item.type === 'income' ? 'income' : 'expense';
            const amountPrefix = item.type === 'income' ? '+ ' : '- ';

            const footerHTML = `
                <div class="data-card-footer">
                    ${notesHTML}
                    <div class="data-card-actions" ${actionsMargin}>
                        <button class="action-btn edit" title="Edit"><i data-feather="edit-2"></i></button>
                        <button class="action-btn delete" title="Delete"><i data-feather="trash-2"></i></button>
                    </div>
                </div>
            `;

            card.innerHTML = `
                <div class="data-card-header">
                    <span class="type">${typeDisplay}</span>
                    <span class="amount ${amountColorClass}">${amountPrefix}${formatRupiah(item.jumlah.toString())}</span>
                </div>
                <div class="data-card-body">
                    <span class="label">${item.label}</span>
                    <span class="date">${new Date(item.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                ${footerHTML}
            `;

            cardsContainer.appendChild(card);
        });

        feather.replace(); // To render new icons
    }

    async function fetchTransactions(pageNum) {
        if (isLoading || allDataLoaded) return;
        isLoading = true;
        loadingSpinner.style.display = 'flex';

        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) {
                window.location.href = '../auth/sign-in/index.html';
                return;
            }

            const from = pageNum * itemsPerPage;
            const to = from + itemsPerPage - 1;

            const { data, error } = await supabase
                .from('Manager')
                .select('*')
                .eq('user_id', user.data.user.id)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (data.length > 0) {
                if (pageNum === 0) {
                    transactions = data;
                    renderCards(transactions, false);
                } else {
                    transactions = [...transactions, ...data];
                    renderCards(data, true); // Only render the new cards
                }
            }

            if (data.length < itemsPerPage) {
                allDataLoaded = true;
            }

        } catch (error) {
            console.error('Error fetching transactions:', error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            isLoading = false;
            loadingSpinner.style.display = 'none';
        }
    }

    async function searchTransactions(searchTerm) {
        isSearching = true;
        allDataLoaded = true; // Disable infinite scroll
        loadingSpinner.style.display = 'flex';

        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) return;

            const { data, error } = await supabase
                .from('Manager')
                .select('*')
                .eq('user_id', user.data.user.id)
                .ilike('catatan', `%${searchTerm}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            renderCards(data, false);
            updateSummary(data);

        } catch (error) {
            console.error("Error searching transactions:", error);
            showToast("Error during search.", "error");
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    const debouncedSearch = debounce(searchTransactions, 500);

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        if (searchTerm) {
            labelFilterInput.value = ''; // Clear label filter
            isFiltering = false;
            debouncedSearch(searchTerm);
        } else {
            // If search is cleared, reset to initial paginated view
            isSearching = false;
            fetchInitialData();
            fetchAndSetTotals(); // This will show grand totals
        }
    });

    function renderLabelFilterSuggestions() {
        labelFilterSuggestions.innerHTML = '';
        const inputValue = labelFilterInput.value.toLowerCase().trim();

        const allItem = document.createElement('div');
        allItem.classList.add('suggestion-item');
        allItem.textContent = 'All Labels';
        allItem.addEventListener('click', () => {
            labelFilterInput.value = '';
            labelFilterSuggestions.style.display = 'none';
            isFiltering = false;
            fetchInitialData(); // This will fetch page 1
            fetchAndSetTotals();  // This will show grand totals
        });
        labelFilterSuggestions.appendChild(allItem);

        const filtered = labels.filter(l => l.label_name.toLowerCase().includes(inputValue));

        filtered.forEach(label => {
            const item = document.createElement('div');
            item.classList.add('suggestion-item');
            item.textContent = label.label_name;
            item.addEventListener('click', () => {
                labelFilterInput.value = label.label_name;
                labelFilterSuggestions.style.display = 'none';
                searchInput.value = '';
                isSearching = false;
                filterTransactionsByLabel(label.label_name);
            });
            labelFilterSuggestions.appendChild(item);
        });

        labelFilterSuggestions.style.display = 'block';
    }


    async function fetchInitialData() {
        // Fetch labels first, as they are independent
        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) return; // Guard clause

            const { data: labelListData, error: labelListError } = await supabase
                .from('LabelList')
                .select('*')
                .eq('user_id', user.data.user.id);

            if (labelListError) throw labelListError;
            labels = labelListData;
        } catch (error) {
            console.error('Error fetching labels:', error);
            showToast('Could not load labels.', 'error');
        }

        // Fetch totals and first page of transactions
        fetchAndSetTotals();
        isSearching = false; // Ensure we are not in search mode
        isFiltering = false;
        transactions = [];
        page = 0;
        allDataLoaded = false;
        document.getElementById('dataList').innerHTML = ''; // Clear card container
        await fetchTransactions(0);
    }

    window.addEventListener('scroll', () => {
        if (isLoading || allDataLoaded || isSearching || isFiltering) return;

        if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 100) {
            page++;
            fetchTransactions(page);
        }
    });

    // Event Listeners for modal and form
    signOutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showToast(`Error signing out: ${error.message}`, 'error');
            return;
        }
        showToast('You have been signed out.', 'info');
        setTimeout(() => {
            window.location.href = '../auth/sign-in/';
        }, 1500);
    });
    addDataBtn.addEventListener('click', toggleModal);
    cancelBtn.addEventListener('click', toggleModal);
    confirmYesBtn.addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
        }
        closeConfirmModal();
    });
    confirmNoBtn.addEventListener('click', closeConfirmModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            toggleModal();
        }
        if (e.target === confirmModal) {
            closeConfirmModal();
        }
    });
    jumlahInput.addEventListener('keyup', (e) => {
        jumlahInput.value = formatRupiah(e.target.value);
    });

    dataListContainer.addEventListener('click', (e) => {
        const editButton = e.target.closest('.action-btn.edit');
        if (editButton) {
            const card = editButton.closest('.data-card');
            const transactionId = card.dataset.id;
            openEditModal(transactionId);
            return;
        }

        const deleteButton = e.target.closest('.action-btn.delete');
        if (deleteButton) {
            const card = deleteButton.closest('.data-card');
            const transactionId = card.dataset.id;
            deleteTransaction(transactionId);
        }
    });

    labelFilterInput.addEventListener('input', renderLabelFilterSuggestions);
    labelFilterInput.addEventListener('click', renderLabelFilterSuggestions);

    fetchInitialData(); 
}); 