// --- Pagination & Filter State ---
let currentPage = 0;
const pageSize = 10;
let currentSortBy = 'date';
let currentSortDir = 'desc';

let deleteTargetId = null;
let deleteTargetType = 'expense'; // 'expense' or 'category'

// --- Load and Render Expenses List ---
async function loadExpenses() {
    const tableBody = document.getElementById('expenseTableBody');
    if (!tableBody) return; // Not on the expenses page

    const categoryId = document.getElementById('filterCategory').value;
    const paymentMethod = document.getElementById('filterPayment').value;
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const search = document.getElementById('filterSearch').value;

    let queryParams = `?page=${currentPage}&size=${pageSize}&sortBy=${currentSortBy}&sortDir=${currentSortDir}`;
    
    if (categoryId) queryParams += `&categoryId=${categoryId}`;
    if (paymentMethod) queryParams += `&paymentMethod=${paymentMethod}`;
    if (startDate) queryParams += `&startDate=${startDate}`;
    if (endDate) queryParams += `&endDate=${endDate}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;

    showLoader();
    try {
        const res = await apiRequest(`/expenses${queryParams}`);
        renderExpenseTable(res.content);
        renderPagination(res);
    } catch (err) {
        showToast('Error', 'Failed to retrieve expenses logs.', 'danger');
        console.error(err);
    } finally {
        hideLoader();
    }
}

// --- Render Expense Rows ---
function renderExpenseTable(expenses) {
    const tableBody = document.getElementById('expenseTableBody');
    if (!tableBody) return;

    if (expenses.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 32px;">No transactions matching the filters were found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    expenses.forEach(e => {
        const row = document.createElement('tr');
        
        let badgeClass = 'badge-violet';
        const cat = e.categoryName.toLowerCase();
        if (cat.includes('food') || cat.includes('eat')) badgeClass = 'badge-emerald';
        else if (cat.includes('shop')) badgeClass = 'badge-violet';
        else if (cat.includes('bill') || cat.includes('rent')) badgeClass = 'badge-rose';
        else if (cat.includes('travel') || cat.includes('cab')) badgeClass = 'badge-amber';

        row.innerHTML = `
            <td>#TX-${e.expenseId}</td>
            <td>${e.date}</td>
            <td><span class="badge ${badgeClass}">${e.categoryName}</span></td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.description}</td>
            <td><i class="fas ${getPaymentIcon(e.paymentMethod)}" style="margin-right: 4px;"></i> ${e.paymentMethod}</td>
            <td style="font-weight: 700; color: var(--color-danger); text-align: right;">INR ${e.amount.toFixed(2)}</td>
            <td>
                <div style="display: flex; gap: 6px; justify-content: center;">
                    <button class="icon-btn edit" onclick="openEditExpenseModal(${JSON.stringify(e).replace(/"/g, '&quot;')})" title="Edit Transaction">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete" onclick="triggerDeleteConfirm(${e.expenseId}, 'expense')" title="Delete Transaction">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function getPaymentIcon(method) {
    method = method.toLowerCase();
    if (method.includes('cash')) return 'fa-money-bill-wave';
    if (method.includes('card') || method.includes('credit')) return 'fa-credit-card';
    if (method.includes('upi') || method.includes('net')) return 'fa-mobile-alt';
    return 'fa-exchange-alt';
}

// --- Render Table Page Navigators ---
function renderPagination(pageData) {
    const info = document.getElementById('paginationInfo');
    const container = document.getElementById('paginationControls');
    if (!info || !container) return;

    const startElem = pageData.number * pageData.size + 1;
    const endElem = Math.min((pageData.number + 1) * pageData.size, pageData.totalElements);
    
    info.textContent = pageData.totalElements > 0 
        ? `Showing ${startElem} to ${endElem} of ${pageData.totalElements} records`
        : 'Showing 0 to 0 of 0 records';

    container.innerHTML = '';
    
    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = pageData.first;
    prevBtn.addEventListener('click', () => {
        currentPage--;
        loadExpenses();
    });
    container.appendChild(prevBtn);

    // Page Numbers (Limit 5 pages displayed)
    const totalPages = pageData.totalPages;
    let startPage = Math.max(0, pageData.number - 2);
    let endPage = Math.min(totalPages - 1, pageData.number + 2);

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === pageData.number ? 'active' : ''}`;
        pageBtn.textContent = i + 1;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            loadExpenses();
        });
        container.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = pageData.last;
    nextBtn.addEventListener('click', () => {
        currentPage++;
        loadExpenses();
    });
    container.appendChild(nextBtn);
}

// --- Sort Controller Helper ---
function changeSort(field) {
    if (currentSortBy === field) {
        currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortBy = field;
        currentSortDir = 'desc';
    }
    currentPage = 0;
    
    // Update active visual cues on table headers
    document.querySelectorAll('.custom-table th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    
    const activeHeader = document.getElementById(`th-${field}`);
    if (activeHeader) {
        activeHeader.classList.add(`sort-${currentSortDir}`);
    }

    loadExpenses();
}

// --- Load Category Dropdowns ---
async function loadCategories() {
    try {
        const categories = await apiRequest('/categories');
        
        // Populate Filter dropdown if present
        const filterDropdown = document.getElementById('filterCategory');
        if (filterDropdown) {
            filterDropdown.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(c => {
                filterDropdown.innerHTML += `<option value="${c.categoryId}">${c.categoryName}</option>`;
            });
        }

        // Populate Modal Form dropdown if present
        const formDropdown = document.getElementById('expenseCategory');
        if (formDropdown) {
            formDropdown.innerHTML = '<option value="" disabled selected>Choose Category</option>';
            categories.forEach(c => {
                formDropdown.innerHTML += `<option value="${c.categoryId}">${c.categoryName}</option>`;
            });
        }

        // If on the category management page, load the category card grids
        const categoryGrid = document.getElementById('categoriesGrid');
        if (categoryGrid) {
            renderCategoryGrid(categories);
        }

    } catch (err) {
        console.error('Failed to load categories', err);
    }
}

// --- Render Categories Grid ---
async function renderCategoryGrid(categories) {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    if (categories.length === 0) {
        grid.innerHTML = `<div class="glass-panel" style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-secondary);">No categories found. Click 'Add Category' to configure budget targets!</div>`;
        return;
    }

    // Gathers actual spent metrics for each category to compute percentages
    showLoader();
    let summaryData = {};
    try {
        summaryData = await apiRequest('/reports/summary');
    } catch (err) {
        console.log('Failed to fetch summary for category card progress.');
    } finally {
        hideLoader();
    }

    const categorySpentMap = summaryData.categorySpent || {};

    grid.innerHTML = '';
    categories.forEach(c => {
        const spent = categorySpentMap[c.categoryName] || 0;
        const percent = c.budgetLimit > 0 ? (spent / c.budgetLimit) * 100 : 0;
        
        // Progress bar status
        let progressClass = 'progress-safe';
        if (percent > 100) progressClass = 'progress-danger';
        else if (percent >= 80) progressClass = 'progress-warn';

        const card = document.createElement('div');
        card.className = 'category-card glass-panel glass-panel-hover';
        card.innerHTML = `
            <div class="cat-header">
                <div class="cat-title">
                    <h3>${c.categoryName}</h3>
                    <p>Budget Allocation Tracker</p>
                </div>
                <div class="metric-icon" style="background: rgba(168, 85, 247, 0.08); color: #a855f7;">
                    <i class="fas fa-piggy-bank"></i>
                </div>
            </div>
            <div class="cat-budget-vals">
                <span>Spent: <strong>INR ${spent.toFixed(2)}</strong></span>
                <span>Limit: <strong>INR ${c.budgetLimit.toFixed(2)}</strong></span>
            </div>
            <div class="cat-progress-container">
                <div class="cat-progress-bar ${progressClass}" style="width: ${Math.min(percent, 100)}%;"></div>
            </div>
            <div style="font-size: 0.8rem; font-weight:700; color: ${percent > 100 ? 'var(--color-danger)' : 'var(--text-secondary)'}; margin-bottom: 12px;">
                ${percent.toFixed(0)}% of budget limit spent
            </div>
            <div class="cat-actions">
                <button class="icon-btn edit" onclick="openEditCategoryModal(${JSON.stringify(c).replace(/"/g, '&quot;')})" title="Edit Budget Limit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete" onclick="triggerDeleteConfirm(${c.categoryId}, 'category')" title="Delete Category">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- Trigger Delete Confirmation Modals ---
function triggerDeleteConfirm(id, type) {
    deleteTargetId = id;
    deleteTargetType = type;

    const modal = document.getElementById('deleteConfirmModal');
    const msg = document.getElementById('deleteConfirmMessage');
    
    if (modal && msg) {
        msg.textContent = type === 'expense' 
            ? 'Are you absolutely sure you want to delete this expense transaction? This action is irreversible.'
            : 'Are you sure you want to delete this category? All associated expenses in this category will also be deleted.';
        
        modal.classList.add('active');
    }
}

function closeDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.remove('active');
    deleteTargetId = null;
}

// --- Execute Delete Action ---
async function confirmDelete() {
    if (!deleteTargetId) return;

    showLoader();
    try {
        if (deleteTargetType === 'expense') {
            await apiRequest(`/expenses/${deleteTargetId}`, { method: 'DELETE' });
            showToast('Deleted', 'Expense log deleted successfully.', 'success');
            loadExpenses();
        } else {
            await apiRequest(`/categories/${deleteTargetId}`, { method: 'DELETE' });
            showToast('Deleted', 'Category removed successfully.', 'success');
            loadCategories();
        }
    } catch (err) {
        showToast('Error', 'Deletion action failed.', 'danger');
    } finally {
        closeDeleteConfirmModal();
        hideLoader();
    }
}

// --- Expense Modals Controls ---
function openAddExpenseModal() {
    document.getElementById('expenseModalTitle').textContent = 'Add Expense Transaction';
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    
    // Set default date to today
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];

    const modal = document.getElementById('expenseModal');
    if (modal) modal.classList.add('active');
}

function openEditExpenseModal(e) {
    document.getElementById('expenseModalTitle').textContent = 'Modify Expense Log';
    document.getElementById('expenseId').value = e.expenseId;
    document.getElementById('expenseAmount').value = e.amount;
    document.getElementById('expenseCategory').value = e.categoryId;
    document.getElementById('expenseDescription').value = e.description;
    document.getElementById('expenseDate').value = e.date;
    document.getElementById('expensePayment').value = e.paymentMethod;

    const modal = document.getElementById('expenseModal');
    if (modal) modal.classList.add('active');
}

function closeExpenseModal() {
    const modal = document.getElementById('expenseModal');
    if (modal) modal.classList.remove('active');
}

// --- Submit Expense Form Handler ---
async function saveExpense(evt) {
    evt.preventDefault();

    const id = document.getElementById('expenseId').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const categoryId = parseInt(document.getElementById('expenseCategory').value);
    const description = document.getElementById('expenseDescription').value.trim();
    const date = document.getElementById('expenseDate').value;
    const paymentMethod = document.getElementById('expensePayment').value;

    if (!amount || !categoryId || !description || !date || !paymentMethod) {
        showToast('Validation Failed', 'Please complete all required fields.', 'danger');
        return;
    }

    const payload = { amount, categoryId, description, date, paymentMethod };
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/expenses/${id}` : '/expenses';

    showLoader();
    try {
        const res = await apiRequest(endpoint, {
            method: method,
            body: JSON.stringify(payload)
        });

        // Trigger warning alert if backend indicates budget limit breach
        if (res.budgetExceeded) {
            showToast('Budget Warning', res.warningMessage, 'warning');
        } else {
            showToast('Transaction Saved', `Expense successfully recorded.`, 'success');
        }

        closeExpenseModal();
        loadExpenses();
    } catch (err) {
        showToast('Error Saving', err.message, 'danger');
    } finally {
        hideLoader();
    }
}

// --- Category Modals Controls ---
function openAddCategoryModal() {
    document.getElementById('categoryModalTitle').textContent = 'Create Budget Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';

    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.add('active');
}

function openEditCategoryModal(c) {
    document.getElementById('categoryModalTitle').textContent = 'Modify Budget Limit';
    document.getElementById('categoryId').value = c.categoryId;
    document.getElementById('categoryName').value = c.categoryName;
    document.getElementById('categoryLimit').value = c.budgetLimit;

    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.add('active');
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.remove('active');
}

// --- Submit Category Form Handler ---
async function saveCategory(evt) {
    evt.preventDefault();

    const id = document.getElementById('categoryId').value;
    const categoryName = document.getElementById('categoryName').value.trim();
    const budgetLimit = parseFloat(document.getElementById('categoryLimit').value);

    if (!categoryName || isNaN(budgetLimit) || budgetLimit < 0) {
        showToast('Validation Error', 'Enter a valid name and non-negative budget limit.', 'danger');
        return;
    }

    const payload = { categoryName, budgetLimit };
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/categories/${id}` : '/categories';

    showLoader();
    try {
        await apiRequest(endpoint, {
            method: method,
            body: JSON.stringify(payload)
        });

        showToast('Success', `Category budget configuration saved.`, 'success');
        closeCategoryModal();
        loadCategories();
    } catch (err) {
        showToast('Error', err.message, 'danger');
    } finally {
        hideLoader();
    }
}

// --- Page Bindings Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial category loading (needed for filter selects and modals)
    const expenseTable = document.getElementById('expenseTableBody');
    const categoryGrid = document.getElementById('categoriesGrid');

    if (expenseTable || categoryGrid) {
        loadCategories();
    }

    // 2. Load Expenses
    if (expenseTable) {
        loadExpenses();

        // Bind filter event listeners to trigger dynamic table reloading
        document.getElementById('filterCategory').addEventListener('change', () => { currentPage = 0; loadExpenses(); });
        document.getElementById('filterPayment').addEventListener('change', () => { currentPage = 0; loadExpenses(); });
        document.getElementById('filterStartDate').addEventListener('change', () => { currentPage = 0; loadExpenses(); });
        document.getElementById('filterEndDate').addEventListener('change', () => { currentPage = 0; loadExpenses(); });
        
        let searchTimer;
        document.getElementById('filterSearch').addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                currentPage = 0;
                loadExpenses();
            }, 300);
        });

        // Bind expense modal forms
        document.getElementById('expenseForm').addEventListener('submit', saveExpense);
        document.getElementById('addExpenseBtn').addEventListener('click', openAddExpenseModal);
        document.getElementById('closeExpenseModalBtn').addEventListener('click', closeExpenseModal);
    }

    // 3. Category Forms
    if (categoryGrid) {
        document.getElementById('categoryForm').addEventListener('submit', saveCategory);
        document.getElementById('addCategoryBtn').addEventListener('click', openAddCategoryModal);
        document.getElementById('closeCategoryModalBtn').addEventListener('click', closeCategoryModal);
    }

    // 4. Bind global delete confirms
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
    }
    const closeDeleteBtn = document.getElementById('closeDeleteModalBtn');
    if (closeDeleteBtn) {
        closeDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
    }
});
