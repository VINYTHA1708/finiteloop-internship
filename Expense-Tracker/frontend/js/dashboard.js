let trendChart = null;
let categoryChart = null;
let paymentChart = null;

// --- Load and Render Dashboard Analytics ---
async function loadDashboard() {
    showLoader();
    try {
        const data = await apiRequest('/reports/summary');
        
        // Populate Cards with animations
        animateCounter('totalSpent', data.totalSpent, 'INR ');
        animateCounter('remainingBudget', data.remainingBudget, 'INR ');
        animateCounter('transactionsCount', data.transactionsCount, '');
        animateCounter('categoriesCount', data.categoriesCount, '');

        // Populate Remaining Budget Progress and Warning
        const budgetPercent = data.totalBudget > 0 ? (data.currentMonthSpent / data.totalBudget) * 100 : 0;
        const progressBar = document.getElementById('budgetProgress');
        const budgetText = document.getElementById('budgetText');
        
        if (progressBar && budgetText) {
            progressBar.style.width = `${Math.min(budgetPercent, 100)}%`;
            budgetText.textContent = `${Math.round(budgetPercent)}% of Monthly Budget Used`;
            
            // Set alert class based on threshold
            progressBar.className = 'cat-progress-bar';
            if (budgetPercent > 100) {
                progressBar.classList.add('progress-danger');
            } else if (budgetPercent >= 80) {
                progressBar.classList.add('progress-warn');
            } else {
                progressBar.classList.add('progress-safe');
            }
        }

        // Render Recent Transactions
        renderRecentTransactions(data.recentExpenses);

        // Render Analytics Charts (Dynamic data points)
        renderTrendChart(data.monthlyTrend);
        renderCategoryChart(data.categorySpent);
        renderPaymentChart(data.recentExpenses);

    } catch (err) {
        showToast('Dashboard Load Error', 'Could not retrieve financial analytics data.', 'danger');
        console.error(err);
    } finally {
        hideLoader();
    }
}

// --- Text Animating Number Counter ---
function animateCounter(elementId, targetValue, prefix = '') {
    const el = document.getElementById(elementId);
    if (!el) return;

    let start = 0;
    const duration = 800; // ms
    const stepTime = 15;
    const steps = duration / stepTime;
    const increment = targetValue / steps;

    const timer = setInterval(() => {
        start += increment;
        if (start >= targetValue) {
            clearInterval(timer);
            el.textContent = prefix + targetValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            el.textContent = prefix + Math.floor(start).toLocaleString('en-IN');
        }
    }, stepTime);
}

// --- Render Recent Transactions List ---
function renderRecentTransactions(transactions) {
    const tbody = document.getElementById('recentTransactionsBody');
    if (!tbody) return;

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">No recent expenses found. Click 'Add Expense' to get started!</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    transactions.forEach(t => {
        const row = document.createElement('tr');
        
        // Category Badge class picker
        let badgeClass = 'badge-violet';
        const cat = t.categoryName.toLowerCase();
        if (cat.includes('food') || cat.includes('eat')) badgeClass = 'badge-emerald';
        else if (cat.includes('shop')) badgeClass = 'badge-violet';
        else if (cat.includes('bill') || cat.includes('rent')) badgeClass = 'badge-rose';
        else if (cat.includes('travel') || cat.includes('cab')) badgeClass = 'badge-amber';

        row.innerHTML = `
            <td>${t.date}</td>
            <td><span class="badge ${badgeClass}">${t.categoryName}</span></td>
            <td>${t.description}</td>
            <td>
                <span style="font-size: 0.85rem; font-weight:600; color: var(--text-secondary);">
                    <i class="fas ${getPaymentIcon(t.paymentMethod)}" style="margin-right: 4px;"></i> ${t.paymentMethod}
                </span>
            </td>
            <td style="font-weight: 700; color: var(--color-danger); text-align: right;">-INR ${t.amount.toFixed(2)}</td>
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

// --- Render Chart 1: Line Area Monthly Expense Trend ---
function renderTrendChart(monthlyTrendData) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    if (trendChart) trendChart.destroy();

    const labels = Object.keys(monthlyTrendData);
    const data = Object.values(monthlyTrendData);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const accentColor = '#6366f1';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // Gradient Background
    const chartContext = ctx.getContext('2d');
    const gradient = chartContext.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Spending',
                data: data,
                borderColor: accentColor,
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: accentColor,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: 600 } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor,
                        font: { family: 'Plus Jakarta Sans', weight: 600 },
                        callback: function(val) { return 'INR ' + val; }
                    }
                }
            }
        }
    });
}

// --- Render Chart 2: Category Allocation Doughnut Chart ---
function renderCategoryChart(categorySpentData) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (categoryChart) categoryChart.destroy();

    const labels = Object.keys(categorySpentData);
    const data = Object.values(categorySpentData);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f8fafc' : '#1e293b';

    if (labels.length === 0) {
        // Render empty chart visual placeholder
        labels.push('No Expenses');
        data.push(1);
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#6366f1', // Indigo
                    '#10b981', // Emerald
                    '#f59e0b', // Amber
                    '#ef4444', // Rose
                    '#0ea5e9', // Sky Blue
                    '#a855f7', // Purple
                ],
                borderWidth: isDark ? 2 : 1,
                borderColor: isDark ? '#1e293b' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: { family: 'Plus Jakarta Sans', weight: 600, size: 11 },
                        padding: 14
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// --- Render Chart 3: Payment Method Distribution Bar Chart ---
function renderPaymentChart(expenses) {
    const ctx = document.getElementById('paymentChart');
    if (!ctx) return;

    if (paymentChart) paymentChart.destroy();

    // Grouping totals by payment method
    const paymentGroups = { 'Cash': 0, 'Card': 0, 'UPI': 0, 'Net Banking': 0 };
    expenses.forEach(e => {
        const method = e.paymentMethod;
        if (paymentGroups[method] !== undefined) {
            paymentGroups[method] += e.amount;
        } else {
            paymentGroups['Cash'] += e.amount; // Fallback
        }
    });

    const labels = Object.keys(paymentGroups);
    const data = Object.values(paymentGroups);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    paymentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spent Amount',
                data: data,
                backgroundColor: 'rgba(168, 85, 247, 0.75)', // Purple trans
                borderRadius: 6,
                maxBarThickness: 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: 600 } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor,
                        font: { family: 'Plus Jakarta Sans', weight: 600 }
                    }
                }
            }
        }
    });
}

// Reload charts when switching theme so the gridcolors match
document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            // Give theme toggle speed to finish applying
            setTimeout(() => {
                const summaryPanel = document.getElementById('totalSpent');
                if (summaryPanel) loadDashboard();
            }, 100);
        });
    }

    // Initial Dashboard Load
    if (document.getElementById('totalSpent')) {
        loadDashboard();
    }
});
