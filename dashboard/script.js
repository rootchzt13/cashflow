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

    // Calculator Elements
    const openCalculatorBtn = document.getElementById('openCalculatorBtn');
    const calculatorModal = document.getElementById('calculatorModal');
    const closeCalculatorBtn = document.getElementById('closeCalculatorBtn');
    const calculateBtn = document.getElementById('calculateBtn');
    const addProfitToAppBtn = document.getElementById('addProfitToAppBtn');
    const calcResultSection = document.getElementById('calcResultSection');
    const calcResultsContainer = document.getElementById('calcResults');

    // Settings Modal Elements
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsForm = document.getElementById('settingsForm');

    let transactions = [];
    let labels = [];
    let operationalCosts = {
        biaya_checkout: 1500,
        biaya_buat_toko: 8000,
        biaya_peking: 850,
        biaya_username: 1000,
        biaya_ongkir: 0,
        id: null
    };
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

    async function updateTotalSummary() {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) throw userError || new Error("User not found.");

            const { data, error } = await supabase
                .from('Manager')
                .select('jumlah, type')
                .eq('user_id', userData.user.id);

            if (error) throw error;

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
        } catch (error) {
            console.error("Error updating summary:", error);
            showToast("Could not update summary totals.", "error");
        }
    }

    function updateSummary(data) {
        // This function is now deprecated and will not be used to prevent calculation errors.
        // The new `updateTotalSummary` function should be used instead.
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

    function renderLabelDropdown() {
        labelSuggestionsContainer.innerHTML = '';
        if (labels.length > 0) {
            labelSuggestionsContainer.classList.add('scrollable');
            labels.forEach(label => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.dataset.labelName = label.label_name;

                const labelText = document.createElement('span');
                labelText.textContent = label.label_name;
                
                const deleteIcon = document.createElement('i');
                deleteIcon.dataset.feather = 'trash-2';
                deleteIcon.className = 'delete-icon';
                deleteIcon.dataset.labelId = label.id;
                deleteIcon.dataset.labelName = label.label_name;

                item.appendChild(labelText);
                item.appendChild(deleteIcon);
                labelSuggestionsContainer.appendChild(item);
            });
            feather.replace(); // To render the new trash icons
        } else {
            labelSuggestionsContainer.classList.remove('scrollable');
            labelSuggestionsContainer.innerHTML = `<div class="suggestion-item"><span>No labels found. Type to create one.</span></div>`;
        }
        labelSuggestionsContainer.style.display = 'block';
    }

    async function deleteLabel(labelId, labelName) {
        // First, check if the label is being used in any transaction
        const { data: usageData, error: usageError } = await supabase
            .from('Manager')
            .select('id', { count: 'exact' })
            .eq('label', labelName);

        if (usageError) {
            showToast(`Error checking label usage: ${usageError.message}`, 'error');
            return;
        }

        if (usageData.length > 0) {
            showToast(`Cannot delete label "${labelName}" as it is currently in use by ${usageData.length} transaction(s).`, 'error');
            return;
        }

        // If not in use, proceed with deletion
        showConfirmModal(`Are you sure you want to delete the label "${labelName}"? This action cannot be undone.`, async () => {
            const { error: deleteError } = await supabase
                .from('LabelList')
                .delete()
                .eq('id', labelId);

            if (deleteError) {
                showToast(`Error deleting label: ${deleteError.message}`, 'error');
            } else {
                showToast(`Label "${labelName}" has been deleted successfully.`);
                // Refresh labels from the database
                await fetchLabels(); 
                // Re-render the dropdown if it's open
                if (labelSuggestionsContainer.style.display === 'block') {
                    renderLabelDropdown();
                }
            }
            closeConfirmModal();
        });
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
        if (!labelFilterDropdown) return; // Guard clause
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
            item.dataset.value = option.value;
            typeSuggestionsContainer.appendChild(item);
        });

        typeSuggestionsContainer.style.display = 'block';
    }

    function handleCalculator() {
        // --- Helper function to parse inputs ---
        const getNumericValue = (id) => unformatRupiah(document.getElementById(id).value) || 0;
        
        // --- Get all input values ---
        const totalPayment = getNumericValue('calcTotalPayment');
        const itemsShipped = getNumericValue('calcItemsShipped');
        const itemCost = getNumericValue('calcItemCost');
        const itemsDelivered = getNumericValue('calcItemsDelivered');
        const initialShipping = getNumericValue('calcInitialShipping');
        const shippingDiscount = getNumericValue('calcShippingDiscount');

        // --- Perform calculations based on user's custom costs ---
        const totalInitialCost = itemCost * itemsShipped;

        const coSalary = itemsDelivered * operationalCosts.biaya_checkout;
        const storeFee = (itemsShipped / 10) * operationalCosts.biaya_buat_toko;
        const packingFee = itemsShipped * operationalCosts.biaya_peking;
        const usernameFee = (itemsShipped / 2) * operationalCosts.biaya_username;
        const netShippingCost = initialShipping * (1 - (shippingDiscount / 100));
        
        const totalOperationalCost = coSalary + storeFee + packingFee + usernameFee + netShippingCost;

        // 3. Profit Bersih
        const netProfit = totalPayment - totalInitialCost - totalOperationalCost;

        // --- Display results ---
        calcResultsContainer.innerHTML = `
            <p><strong>Total Payment Shopee:</strong> ${formatRupiah(totalPayment.toString())}</p>
            <hr>
            <h4>Modal Awal</h4>
            <p>Total Modal ( ${formatRupiah(itemCost.toString())} x ${itemsShipped} pcs ): <strong>${formatRupiah(totalInitialCost.toString())}</strong></p>
            <hr>
            <h4>Biaya Operasional</h4>
            <p>Gaji CO ( ${itemsDelivered} pcs x ${formatRupiah(operationalCosts.biaya_checkout.toString())} ): ${formatRupiah(coSalary.toString())}</p>
            <p>Gaji Toko ( ${itemsShipped / 10} toko x ${formatRupiah(operationalCosts.biaya_buat_toko.toString())} ): ${formatRupiah(storeFee.toString())}</p>
            <p>Biaya Packing ( ${itemsShipped} pcs x ${formatRupiah(operationalCosts.biaya_peking.toString())} ): ${formatRupiah(packingFee.toString())}</p>
            <p>Biaya Username ( ${itemsShipped / 2} x ${formatRupiah(operationalCosts.biaya_username.toString())} ): ${formatRupiah(usernameFee.toString())}</p>
            <p>Biaya Ongkir ( ${formatRupiah(initialShipping.toString())} - ${shippingDiscount}% ): ${formatRupiah(netShippingCost.toString())}</p>
            <p><strong>Total Biaya Operasional:</strong> ${formatRupiah(totalOperationalCost.toString())}</p>
            <hr>
            <p class="final-profit">Profit Bersih: ${formatRupiah(netProfit.toString())}</p>
        `;
        
        calcResultSection.style.display = 'block';
        addProfitToAppBtn.style.display = 'inline-flex';
        addProfitToAppBtn.dataset.profit = netProfit; // Store profit for later use
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
    typeInput.addEventListener('focus', renderTypeSuggestions);
    typeSuggestionsContainer.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'SPAN' || e.target.classList.contains('suggestion-item')) {
            const item = e.target.closest('.suggestion-item');
            typeInput.value = item.textContent.trim();
            typeInput.dataset.value = item.dataset.value;
            typeSuggestionsContainer.style.display = 'none';
        }
    });

    labelInput.addEventListener('focus', renderLabelDropdown);

    document.addEventListener('click', (e) => {
        if (!labelInput.contains(e.target) && !labelSuggestionsContainer.contains(e.target)) {
            labelSuggestionsContainer.style.display = 'none';
        }
        if (!typeInput.contains(e.target) && !typeSuggestionsContainer.contains(e.target)) {
            typeSuggestionsContainer.style.display = 'none';
        }
        if (!labelFilterInput.contains(e.target) && !labelFilterSuggestions.contains(e.target)) {
            labelFilterSuggestions.style.display = 'none';
        }
    });
    
    labelSuggestionsContainer.addEventListener('mousedown', (e) => {
        const deleteIcon = e.target.closest('.delete-icon');
        if (deleteIcon) {
            const labelId = deleteIcon.dataset.labelId;
            const labelName = deleteIcon.dataset.labelName;
            deleteLabel(parseInt(labelId, 10), labelName);
            return; // Stop further processing to prevent selecting the label
        }
        
        const suggestionItem = e.target.closest('.suggestion-item');
        if (suggestionItem && suggestionItem.dataset.labelName) {
            labelInput.value = suggestionItem.dataset.labelName;
            labelSuggestionsContainer.style.display = 'none';
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
            // DO NOT update summary here, it should be independent of filters.
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
                fetchInitialData(); // This will re-fetch transactions and totals correctly
            } catch (error) {
                console.error('Error deleting transaction:', error);
                showToast(`Error: ${error.message}`, 'error');
            }
        });
    }

    async function fetchAndSetTotals() {
        // This function is now replaced by updateTotalSummary to avoid confusion.
        // Calling the new function for compatibility in case other parts still use it.
        await updateTotalSummary();
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
            // DO NOT update summary here, it should be based on all data, not search results.

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
            fetchInitialData(); // Re-fetches page 1 and keeps the correct grand total.
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
        // Fetch labels and operational costs in parallel
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [labelsResponse, costsResponse] = await Promise.all([
                supabase.from('LabelList').select('*').eq('user_id', user.id),
                supabase.from('Operasional').select('*').eq('user_id', user.id).maybeSingle()
            ]);

            if (labelsResponse.error) throw labelsResponse.error;
            labels = labelsResponse.data;
            renderLabelDropdown();

            if (costsResponse.error) throw costsResponse.error;
            if (costsResponse.data) {
                operationalCosts = costsResponse.data;
            }
            // If costsResponse.data is null, the defaults will be used.

        } catch (error) {
            console.error('Error fetching initial data:', error);
            showToast('Could not load initial data.', 'error');
        }

        // Fetch totals and first page of transactions
        await updateTotalSummary();
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

    // Calculator Event Listeners
    openCalculatorBtn.addEventListener('click', () => {
        // Pre-fill default shipping cost from settings, ensuring it's not null
        const defaultShipping = operationalCosts.biaya_ongkir || 0;
        document.getElementById('calcInitialShipping').value = formatRupiah(defaultShipping.toString());
        calculatorModal.classList.add('active');
    });
    closeCalculatorBtn.addEventListener('click', () => calculatorModal.classList.remove('active'));
    calculateBtn.addEventListener('click', handleCalculator);

    // Settings Modal Listeners
    openSettingsBtn.addEventListener('click', () => {
        // Populate the form with current costs before showing, ensuring values are not null
        document.getElementById('settingGajiCo').value = formatRupiah((operationalCosts.biaya_checkout || 0).toString());
        document.getElementById('settingGajiToko').value = formatRupiah((operationalCosts.biaya_buat_toko || 0).toString());
        document.getElementById('settingBiayaPacking').value = formatRupiah((operationalCosts.biaya_peking || 0).toString());
        document.getElementById('settingBiayaUsername').value = formatRupiah((operationalCosts.biaya_username || 0).toString());
        document.getElementById('settingBiayaOngkir').value = formatRupiah((operationalCosts.biaya_ongkir || 0).toString());
        settingsModal.classList.add('active');
    });
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('saveSettingsBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const getNumericValue = (id) => unformatRupiah(document.getElementById(id).value) || 0;

            const newCosts = {
                user_id: user.id,
                biaya_checkout: getNumericValue('settingGajiCo'),
                biaya_buat_toko: getNumericValue('settingGajiToko'),
                biaya_peking: getNumericValue('settingBiayaPacking'),
                biaya_username: getNumericValue('settingBiayaUsername'),
                biaya_ongkir: getNumericValue('settingBiayaOngkir'),
            };

            // If there's an existing ID, include it for the upsert to work as an update.
            if (operationalCosts.id) {
                newCosts.id = operationalCosts.id;
            }

            const { data, error } = await supabase
                .from('Operasional')
                .upsert(newCosts)
                .select()
                .single();
            
            if (error) throw error;
            
            // Update the global costs object with the newly saved data
            operationalCosts = data;
            
            showToast('Pengaturan biaya berhasil disimpan!', 'success');
            settingsModal.classList.remove('active');

        } catch (error) {
            console.error('Error saving settings:', error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Simpan Pengaturan';
        }
    });

    addProfitToAppBtn.addEventListener('click', () => {
        const profit = addProfitToAppBtn.dataset.profit;
        if (profit) {
            // Close calculator and open the 'add data' modal
            calculatorModal.classList.remove('active');
            toggleModal();

            // Reset the form first
            resetModal();

            // Pre-fill the form
            modalTitle.textContent = 'Tambah Profit dari Kalkulator';
            typeInput.value = 'Pemasukan';
            typeInput.dataset.value = 'income';
            jumlahInput.value = formatRupiah(profit);
            labelInput.value = 'Profit Bisnis';
            document.getElementById('catatan').value = `Profit bersih dihitung dari kalkulator.
Total Pemasukan: ${document.getElementById('calcTotalPayment').value}
Total Pengiriman: ${document.getElementById('calcItemsShipped').value} pcs`;
        }
    });

    // Add formatting to calculator currency inputs
    ['calcTotalPayment', 'calcItemCost', 'calcInitialShipping'].forEach(id => {
        document.getElementById(id).addEventListener('keyup', (e) => {
            e.target.value = formatRupiah(e.target.value);
        });
    });
    
    // Add formatting to settings currency inputs
    ['settingGajiCo', 'settingGajiToko', 'settingBiayaPacking', 'settingBiayaUsername', 'settingBiayaOngkir'].forEach(id => {
        document.getElementById(id).addEventListener('keyup', (e) => {
            e.target.value = formatRupiah(e.target.value);
        });
    });
    
    labelFilterInput.addEventListener('input', renderLabelFilterSuggestions);
    labelFilterInput.addEventListener('click', renderLabelFilterSuggestions);

    fetchInitialData(); 
}); 