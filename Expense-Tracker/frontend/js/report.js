// --- Load and Render Filtered Report Data ---
async function generateReport() {
    const tableBody = document.getElementById('reportTableBody');
    if (!tableBody) return;

    const categoryId = document.getElementById('reportCategory').value;
    const paymentMethod = document.getElementById('reportPayment').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    let queryParams = '';
    const params = [];
    if (categoryId) params.push(`categoryId=${categoryId}`);
    if (paymentMethod) params.push(`paymentMethod=${paymentMethod}`);
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    
    if (params.length > 0) {
        queryParams = '?' + params.join('&');
    }

    showLoader();
    try {
        const expenses = await apiRequest(`/reports/filter${queryParams}`);
        
        // Compute Summary Stats
        computeReportStatistics(expenses);

        // Render Table Rows
        renderReportTable(expenses);

    } catch (err) {
        showToast('Report Error', 'Could not compile report from server.', 'danger');
        console.error(err);
    } finally {
        hideLoader();
    }
}

// --- Compute Summary Statistics ---
function computeReportStatistics(expenses) {
    const totalSpentEl = document.getElementById('reportTotalSpent');
    const averageSpentEl = document.getElementById('reportAverageSpent');
    const highestSpentEl = document.getElementById('reportHighestSpent');

    if (!totalSpentEl || !averageSpentEl || !highestSpentEl) return;

    const total = expenses.stream ? expenses.stream().mapToDouble(e => e.amount).sum() : expenses.reduce((sum, e) => sum + e.amount, 0);
    const average = expenses.length > 0 ? total / expenses.size || total / expenses.length : 0;
    const highest = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;

    totalSpentEl.textContent = 'INR ' + total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    averageSpentEl.textContent = 'INR ' + average.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    highestSpentEl.textContent = 'INR ' + highest.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Render Filtered Rows ---
function renderReportTable(expenses) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;

    if (expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 32px;">No matching transactions found for the specified filters.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    expenses.forEach(e => {
        const row = document.createElement('tr');
        
        let badgeClass = 'badge-violet';
        const cat = e.category.categoryName.toLowerCase();
        if (cat.includes('food') || cat.includes('eat')) badgeClass = 'badge-emerald';
        else if (cat.includes('shop')) badgeClass = 'badge-violet';
        else if (cat.includes('bill') || cat.includes('rent')) badgeClass = 'badge-rose';
        else if (cat.includes('travel') || cat.includes('cab')) badgeClass = 'badge-amber';

        row.innerHTML = `
            <td>${e.date}</td>
            <td><span class="badge ${badgeClass}">${e.category.categoryName}</span></td>
            <td>${e.description}</td>
            <td><i class="fas ${getPaymentIcon(e.paymentMethod)}" style="margin-right: 4px;"></i> ${e.paymentMethod}</td>
            <td style="font-weight: 700; color: var(--color-danger); text-align: right;">INR ${e.amount.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

function getPaymentIcon(method) {
    method = method.toLowerCase();
    if (method.includes('cash')) return 'fa-money-bill-wave';
    if (method.includes('card') || method.includes('credit')) return 'fa-credit-card';
    if (method.includes('upi') || method.includes('net')) return 'fa-mobile-alt';
    return 'fa-exchange-alt';
}

// --- Dynamic Categories Dropdown Load ---
async function loadReportCategories() {
    try {
        const categories = await apiRequest('/categories');
        const dropdown = document.getElementById('reportCategory');
        if (dropdown) {
            dropdown.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(c => {
                dropdown.innerHTML += `<option value="${c.categoryId}">${c.categoryName}</option>`;
            });
        }
    } catch (err) {
        console.error('Failed to load categories for reports.', err);
    }
}

// --- Secured PDF/CSV File Exporter with Auth Headers ---
async function exportReportFile(format) {
    const categoryId = document.getElementById('reportCategory').value;
    const paymentMethod = document.getElementById('reportPayment').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    let queryParams = '';
    const params = [];
    if (categoryId) params.push(`categoryId=${categoryId}`);
    if (paymentMethod) params.push(`paymentMethod=${paymentMethod}`);
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    
    if (params.length > 0) {
        queryParams = '?' + params.join('&');
    }

    showLoader();
    try {
        const response = await apiRequest(`/reports/export/${format}${queryParams}`, {
            headers: { 'Accept': format === 'pdf' ? 'application/pdf' : 'text/csv' }
        });

        // Convert the raw stream into a file link and download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `expenses_report_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
        
        showToast('Export Completed', `Successfully downloaded report as ${format.toUpperCase()}.`, 'success');
    } catch (err) {
        showToast('Export Failed', 'An error occurred during file generation.', 'danger');
        console.error(err);
    } finally {
        hideLoader();
    }
}

// --- Initialize Report Actions ---
document.addEventListener('DOMContentLoaded', () => {
    const reportTable = document.getElementById('reportTableBody');
    if (reportTable) {
        loadReportCategories();
        
        // Set default date range to current month
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('reportStartDate').value = startOfMonth.toISOString().split('T')[0];
        document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];

        // Trigger initial report rendering
        generateReport();

        // Bind filter form submit action
        document.getElementById('reportFilterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            generateReport();
        });

        // Bind CSV & PDF Export Buttons
        document.getElementById('exportCsvBtn').addEventListener('click', () => exportReportFile('csv'));
        document.getElementById('exportPdfBtn').addEventListener('click', () => exportReportFile('pdf'));
    }
});
