// --- Dynamic API Resolution ---
const API_BASE = window.location.protocol === 'file:' 
    ? 'http://localhost:8080/api' 
    : '/api';

// --- Persistent Session Management ---
function getSessionToken() {
    return localStorage.getItem('session_token');
}

function getSessionUser() {
    const userStr = localStorage.getItem('session_user');
    return userStr ? JSON.parse(userStr) : null;
}

function setSession(token, user) {
    localStorage.setItem('session_token', token);
    localStorage.setItem('session_user', JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_user');
}

// --- Route Protection ---
function checkAuth() {
    const token = getSessionToken();
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');

    if (!token && !isAuthPage) {
        // Redirect to Login if attempting to view app pages unauthorized
        const rootPath = window.location.protocol === 'file:' 
            ? window.location.href.split('/pages/')[0] + '/pages/login.html'
            : '/pages/login.html';
        window.location.href = rootPath;
    } else if (token && isAuthPage) {
        // Redirect to Dashboard if already logged in and visiting login/register
        const rootPath = window.location.protocol === 'file:' 
            ? window.location.href.split('/pages/')[0] + '/pages/dashboard.html'
            : '/pages/dashboard.html';
        window.location.href = rootPath;
    }
}

// --- Loading Spinner Control ---
function showLoader() {
    let overlay = document.getElementById('spinnerOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'spinnerOverlay';
        overlay.className = 'spinner-overlay';
        overlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(overlay);
    }
    // Force reflow
    overlay.offsetWidth;
    overlay.classList.add('active');
}

function hideLoader() {
    const overlay = document.getElementById('spinnerOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// --- Floating Toast Notifications ---
function showToast(title, message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} glass-panel`;
    
    // Choose icons based on type
    let iconClass = 'fa-check-circle';
    if (type === 'danger') iconClass = 'fa-times-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    if (type === 'info') iconClass = 'fa-info-circle';

    toast.innerHTML = `
        <i class="fas ${iconClass}" style="font-size: 1.25rem; margin-top: 2px;"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-desc">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Event listener for close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4500);
}

// --- Persistent Dark/Light Mode Theme System ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to premium dark mode
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleBtn(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleBtn(newTheme);
    showToast('Theme Updated', `Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode.`, 'info');
}

function updateThemeToggleBtn(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.innerHTML = theme === 'light' 
            ? '<i class="fas fa-moon"></i> <span>Dark Mode</span>' 
            : '<i class="fas fa-sun"></i> <span>Light Mode</span>';
    }
}

// --- Base Request Interceptor Helper ---
async function apiRequest(endpoint, options = {}) {
    const token = getSessionToken();
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    options.headers = {
        ...defaultHeaders,
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (response.status === 401) {
            // Invalidate session on unauthorized error
            clearSession();
            showToast('Session Expired', 'Please log in again.', 'danger');
            setTimeout(() => {
                const rootPath = window.location.protocol === 'file:' 
                    ? window.location.href.split('/pages/')[0] + '/pages/login.html'
                    : '/pages/login.html';
                window.location.href = rootPath;
            }, 1000);
            throw new Error('Unauthorized');
        }

        // Return blob if response is not JSON (useful for file exports)
        const contentType = response.headers.get('Content-Type');
        if (contentType && (contentType.includes('octet-stream') || contentType.includes('pdf') || contentType.includes('csv'))) {
            if (!response.ok) throw new Error('File download failed');
            return response;
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// --- Active Nav Highlighting ---
function highlightActiveNav() {
    const path = window.location.pathname;
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    
    menuItems.forEach(item => {
        const link = item.querySelector('a').getAttribute('href');
        if (path.includes(link)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// --- Profile Rendering ---
function renderProfileCard() {
    const user = getSessionUser();
    if (user) {
        const nameElems = document.querySelectorAll('.profile-name');
        nameElems.forEach(el => el.textContent = user.name);

        const avatarElems = document.querySelectorAll('.avatar');
        avatarElems.forEach(el => {
            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            el.textContent = initials;
        });
    }
}

// --- User Registration & Login Trigger Functions ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuth();
    highlightActiveNav();
    renderProfileCard();

    // Bind Theme Toggle Button if available
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    // Bind Logout Button if available
    const logoutBtn = document.getElementById('logoutLink');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            showLoader();
            try {
                await apiRequest('/auth/logout', { method: 'POST' });
            } catch (err) {
                console.log('Logout API call failed, clearing session locally anyway.');
            } finally {
                clearSession();
                hideLoader();
                showToast('Logged Out', 'You have been safely signed out.', 'success');
                setTimeout(() => {
                    const rootPath = window.location.protocol === 'file:' 
                        ? window.location.href.split('/pages/')[0] + '/pages/login.html'
                        : '/pages/login.html';
                    window.location.href = rootPath;
                }, 1000);
            }
        });
    }

    // Bind Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // Form validations
            if (!email || !password) {
                showToast('Form Error', 'Please fill in all credentials.', 'danger');
                return;
            }

            showLoader();
            try {
                const res = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                setSession(res.token, res.user);
                showToast('Access Granted', `Welcome back, ${res.user.name}!`, 'success');
                
                setTimeout(() => {
                    const rootPath = window.location.protocol === 'file:' 
                        ? window.location.href.split('/pages/')[0] + '/pages/dashboard.html'
                        : '/pages/dashboard.html';
                    window.location.href = rootPath;
                }, 1200);
            } catch (err) {
                showToast('Login Failed', err.message, 'danger');
            } finally {
                hideLoader();
            }
        });
    }

    // Bind Registration Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Form validations
            if (!name || !email || !password || !confirmPassword) {
                showToast('Validation Error', 'Please complete all required fields.', 'danger');
                return;
            }
            if (password.length < 8) {
                showToast('Validation Error', 'Password must be at least 8 characters long.', 'danger');
                return;
            }
            if (password !== confirmPassword) {
                showToast('Validation Error', 'Passwords do not match.', 'danger');
                return;
            }

            showLoader();
            try {
                const res = await apiRequest('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password, confirmPassword })
                });

                setSession(res.token, res.user);
                showToast('Registration Successful', `Account created! Welcome, ${res.user.name}!`, 'success');

                setTimeout(() => {
                    const rootPath = window.location.protocol === 'file:' 
                        ? window.location.href.split('/pages/')[0] + '/pages/dashboard.html'
                        : '/pages/dashboard.html';
                    window.location.href = rootPath;
                }, 1200);
            } catch (err) {
                showToast('Registration Failed', err.message, 'danger');
            } finally {
                hideLoader();
            }
        });
    }
});
