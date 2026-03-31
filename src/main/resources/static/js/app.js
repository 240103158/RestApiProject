// API Configuration
const API_BASE_URL = '/api';
let allPosts = [];
let currentViewingPostId = null;
let isEditMode = false;
let editingPostId = null;
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initialized');

    // ===== HOME PAGE =====
    // FIX: was checking #postsContainer, but home.html uses #postsGrid
    if (document.getElementById('postsGrid')) {
        loadCurrentUser();
        loadPosts();

        // FIX: search input id is correct in home.html
        document.getElementById('searchInput')?.addEventListener('input', e => {
            filterAndDisplayPosts(e.target.value);
        });

        // FIX: modal id in home.html is #createModal (was #postModal in old app.js)
        document.getElementById('createModal')?.addEventListener('click', e => {
            if (e.target.id === 'createModal') closeCreateModal();
        });

        document.getElementById('viewModal')?.addEventListener('click', e => {
            if (e.target.id === 'viewModal') closeViewModal();
        });

        // FIX: input id is #postTitleInput in home.html (was #postTitleInput — correct, kept)
        document.getElementById('postTitleInput')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') submitPost();
        });
    }

    // ===== LOGIN PAGE =====
    if (document.getElementById('loginForm')) {
        initLoginPage();
    }

    // ===== LANDING PAGE =====
    // FIX: landing.html uses id="cursor" and id="cursorRing" — make sure those
    // attributes are ids not just classes (see note in HTML fix below)
    if (document.getElementById('cursor')) {
        initCursor();
        initReveal();
    }
});

// Load current user from localStorage (replaces the undefined loadCurrentUser call)
function loadCurrentUser() {
    currentUser = localStorage.getItem('currentUser');

    const nameDisplay = document.getElementById('userNameDisplay');
    const avatar = document.getElementById('userAvatar');

    if (currentUser) {
        if (nameDisplay) nameDisplay.textContent = currentUser;
        if (avatar) avatar.textContent = currentUser.charAt(0).toUpperCase();
    } else {
        if (nameDisplay) nameDisplay.textContent = 'Guest';
        if (avatar) avatar.textContent = '?';
    }
}

// Handle API Response
function handleResponse(response) {
    if (!response.ok) {
        return response.json().then(errorData => {
            const errorMessage = errorData.message || `HTTP Error ${response.status}`;
            const error = new Error(errorMessage);
            error.status = errorData.status || response.status;
            throw error;
        }).catch(jsonError => {
            if (jsonError.status) throw jsonError; // re-throw our own error
            const error = new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            error.status = response.status;
            throw error;
        });
    }
    return response.json();
}

// Load posts from API
function loadPosts() {
    // FIX: show a simple loading state in #postsGrid (home.html has no #loadingSpinner)
    const grid = document.getElementById('postsGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="state-box">
                <div class="spinner-ring"></div>
                <p style="font-size:13px;color:var(--ink-faint);">Loading posts…</p>
            </div>`;
    }

    fetch(`${API_BASE_URL}/posts`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthHeader()
        }
    })
        .then(response => handleResponse(response))
        .then(data => {
            console.log('✅ Posts loaded successfully:', data);
            allPosts = data.posts || [];
            displayPosts(allPosts);
            updatePostCount(allPosts.length);
        })
        .catch(error => {
            console.error('❌ Error loading posts:', error);
            showErrorState(error.message || 'Failed to load posts. Please try again.');
        });
}

// Update the post count badge in the toolbar
function updatePostCount(count) {
    const el = document.getElementById('postCount');
    if (el) el.textContent = count === 1 ? '1 post' : `${count} posts`;
}

// Display posts in the grid
// FIX: home.html uses #postsGrid, not #postsContainer
function displayPosts(posts) {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    if (!posts || posts.length === 0) {
        grid.innerHTML = `
            <div class="state-box">
                <p style="font-size:13px;color:var(--ink-faint);">No posts yet. Be the first to write one!</p>
            </div>`;
        return;
    }

    grid.innerHTML = posts.map(post => `
        <div class="post-card" onclick="viewPost(${post.id})">
            <div class="post-header">
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <div class="post-meta">
                    <span class="post-author">👤 ${escapeHtml(post.author)}</span>
                    <span class="post-date">📅 ${formatDate(post.createDate)}</span>
                </div>
            </div>
            <div class="post-footer">
                <div class="post-stats">
                    <span class="stat stat-like">👍 ${post.numberOfLikes}</span>
                    <span class="stat stat-dislike">👎 ${post.numberOfDislikes}</span>
                </div>
            </div>
        </div>
    `).join('');

    updatePostCount(posts.length);
    console.log(`📊 Displayed ${posts.length} posts`);
}

function showErrorState(message) {
    const grid = document.getElementById('postsGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="state-box">
                <p style="font-size:13px;color:#e05;">${escapeHtml(message)}</p>
            </div>`;
    }
}

// Filter and display posts based on search
function filterAndDisplayPosts(searchTerm) {
    if (!searchTerm.trim()) {
        displayPosts(allPosts);
        return;
    }
    const filteredPosts = allPosts.filter(post => {
        const term = searchTerm.toLowerCase();
        return post.title.toLowerCase().includes(term) ||
            post.author.toLowerCase().includes(term);
    });
    displayPosts(filteredPosts);
    console.log(`🔍 Filtered to ${filteredPosts.length} posts`);
}

// Keep old name as alias so any stray calls don't break
function filterPosts(term) { filterAndDisplayPosts(term); }

// Sort posts
function sortPosts() {
    const sortType = document.getElementById('sortSelect').value;
    let sortedPosts = [...allPosts];
    switch (sortType) {
        case 'recent':  sortedPosts.sort((a, b) => new Date(b.createDate) - new Date(a.createDate)); break;
        case 'oldest':  sortedPosts.sort((a, b) => new Date(a.createDate) - new Date(b.createDate)); break;
        case 'likes':   sortedPosts.sort((a, b) => b.numberOfLikes - a.numberOfLikes); break;
        case 'author':  sortedPosts.sort((a, b) => a.author.localeCompare(b.author)); break;
    }
    displayPosts(sortedPosts);
}

// View post details
function viewPost(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) {
        showAlert('Post not found', 'error');
        return;
    }

    currentViewingPostId = postId;

    // FIX: home.html uses #viewPostTitle (not #viewTitle)
    document.getElementById('viewPostTitle').textContent = post.title;
    document.getElementById('viewAuthor').textContent = post.author;
    document.getElementById('viewDate').textContent = `Posted on ${formatDate(post.createDate)}`;
    document.getElementById('viewLikes').textContent = post.numberOfLikes;
    document.getElementById('viewDislikes').textContent = post.numberOfDislikes;

    // Set avatar initial
    const dot = document.getElementById('viewAuthorDot');
    if (dot) dot.textContent = post.author.charAt(0).toUpperCase();

    const isOwnPost = currentUser === post.author;
    document.getElementById('editBtn').style.display = isOwnPost ? 'inline-flex' : 'none';
    document.getElementById('deleteBtn').style.display = isOwnPost ? 'inline-flex' : 'none';

    document.getElementById('viewModal').classList.remove('hidden');
    console.log('👁️ Viewing post:', postId);
}

// Close view modal
function closeViewModal() {
    document.getElementById('viewModal').classList.add('hidden');
    currentViewingPostId = null;
}

// Like post
function likePost() {
    if (!currentViewingPostId) return;
    const post = allPosts.find(p => p.id === currentViewingPostId);
    if (!post) return;

    const newLikes = post.numberOfLikes + 1;
    fetch(`${API_BASE_URL}/posts/${currentViewingPostId}`, {
        method: 'PUT',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: post.title, numberOfLikes: newLikes, numberOfDislikes: post.numberOfDislikes })
    })
        .then(response => handleResponse(response))
        .then(() => {
            post.numberOfLikes = newLikes;
            document.getElementById('viewLikes').textContent = newLikes;
            showAlert('👍 Liked!', 'success');
        })
        .catch(error => showAlert(`Failed to like: ${error.message}`, 'error'));
}

// Dislike post
function dislikePost() {
    if (!currentViewingPostId) return;
    const post = allPosts.find(p => p.id === currentViewingPostId);
    if (!post) return;

    const newDislikes = post.numberOfDislikes + 1;
    fetch(`${API_BASE_URL}/posts/${currentViewingPostId}`, {
        method: 'PUT',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: post.title, numberOfLikes: post.numberOfLikes, numberOfDislikes: newDislikes })
    })
        .then(response => handleResponse(response))
        .then(() => {
            post.numberOfDislikes = newDislikes;
            document.getElementById('viewDislikes').textContent = newDislikes;
            showAlert('👎 Noted!', 'success');
        })
        .catch(error => showAlert(`Failed to dislike: ${error.message}`, 'error'));
}

// Edit post
function editPost() {
    const post = allPosts.find(p => p.id === currentViewingPostId);
    if (!post) return;

    isEditMode = true;
    editingPostId = currentViewingPostId;

    // FIX: home.html modal title id is #createModalTitle (not #modalTitle)
    document.getElementById('createModalTitle').textContent = '✏️ Edit Post';
    // FIX: home.html has only #postTitleInput — no separate author field in the modal
    document.getElementById('postTitleInput').value = post.title;

    closeViewModal();
    document.getElementById('createModal').classList.remove('hidden');
    clearFormError();
}

// Delete post
function deletePost() {
    if (!currentViewingPostId) return;
    if (!confirm('🗑️ Are you sure you want to delete this post?')) return;

    fetch(`${API_BASE_URL}/posts/${currentViewingPostId}`, {
        method: 'DELETE',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' }
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(e => { throw new Error(e.message || `HTTP ${response.status}`); });
            }
            return response;
        })
        .then(() => {
            allPosts = allPosts.filter(p => p.id !== currentViewingPostId);
            closeViewModal();
            displayPosts(allPosts);
            showAlert('Post deleted 🗑️', 'success');
        })
        .catch(error => showAlert(`Failed to delete: ${error.message}`, 'error'));
}

// Open create modal
function openCreateModal() {
    isEditMode = false;
    editingPostId = null;
    // FIX: use corrected IDs
    document.getElementById('createModalTitle').textContent = 'New post';
    document.getElementById('postTitleInput').value = '';
    clearFormError();
    document.getElementById('createModal').classList.remove('hidden');
}

// Close create modal
// FIX: was toggling #postModal; home.html uses #createModal
function closeCreateModal() {
    document.getElementById('createModal').classList.add('hidden');
    document.getElementById('postTitleInput').value = '';
    isEditMode = false;
    editingPostId = null;
    clearFormError();
}

// Submit post (create or update)
function submitPost() {
    // FIX: home.html has no #author input in the modal — author comes from server session
    const title = document.getElementById('postTitleInput').value.trim();
    const submitBtn = document.getElementById('createSubmitBtn');

    if (!title) {
        showFormError('⚠️ Please enter a title');
        return;
    }
    if (title.length > 100) {
        showFormError('⚠️ Title must be 100 characters or fewer');
        return;
    }

    clearFormError();
    submitBtn.disabled = true;

    if (isEditMode) {
        const post = allPosts.find(p => p.id === editingPostId);
        if (!post) {
            showFormError('❌ Post not found');
            submitBtn.disabled = false;
            return;
        }
        updatePostTitle(editingPostId, title, post.numberOfLikes, post.numberOfDislikes, submitBtn);
    } else {
        createNewPost(title, submitBtn);
    }
}

// Create new post — author is resolved server-side from Spring Security session
// FIX: removed author from payload; home.html modal has no author field
function createNewPost(title, submitBtn) {
    fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
    })
        .then(response => handleResponse(response))
        .then(() => {
            closeCreateModal();
            loadPosts();
            showAlert('🎉 Post created!', 'success');
        })
        .catch(error => showFormError(`❌ ${error.message}`))
        .finally(() => { submitBtn.disabled = false; });
}

// Update existing post
function updatePostTitle(postId, title, numberOfLikes, numberOfDislikes, submitBtn) {
    fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, numberOfLikes, numberOfDislikes })
    })
        .then(response => handleResponse(response))
        .then(() => {
            closeCreateModal();
            loadPosts();
            showAlert('🎉 Post updated!', 'success');
        })
        .catch(error => showFormError(`❌ ${error.message}`))
        .finally(() => { submitBtn.disabled = false; });
}

// Logout
function logout() {
    if (confirm('🚪 Are you sure you want to log out?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        currentUser = null;
        showAlert('✅ Logged out', 'success');
        setTimeout(() => { window.location.href = '/login'; }, 1000);
    }
}

function getAuthHeader() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return token ? `Bearer ${token}` : '';
}

// ── Form error helpers
// FIX: home.html uses #createFormError / #createFormErrorText (not #formError)
function showFormError(message) {
    const el = document.getElementById('createFormError');
    const txt = document.getElementById('createFormErrorText');
    if (!el || !txt) return;
    txt.textContent = message;
    el.classList.remove('hidden');
}

function clearFormError() {
    document.getElementById('createFormError')?.classList.add('hidden');
}

// ── Alert toasts
// FIX: home.html uses #alertStack (not #alertContainer)
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertStack');
    if (!container) return;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <span class="alert-close" onclick="this.parentElement.remove()">×</span>
    `;
    container.appendChild(alert);
    setTimeout(() => {
        alert.classList.add('removing');
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// ── Format utilities
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return dateString; }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ── Slide animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to   { transform: translateX(0);     opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0);     opacity: 1; }
        to   { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ── Login / Register page
function initLoginPage() {
    console.log('🔐 Login page initialized');

    // FIX: listen on the <form> elements directly, not the panel <div>s
    const loginForm    = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn     = document.getElementById('loginBtn');
    const registerBtn  = document.getElementById('registerBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email    = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            if (!email || !password) { showLoginError('Please fill in all fields'); return; }

            const loginData = new URLSearchParams({ email, password });

            fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: loginData.toString()
            })
                .then(response => {
                    if (!response.ok) throw new Error('Invalid email or password');
                    // Store user from input since backend redirects, not JSON
                    localStorage.setItem('currentUser', email.split('@')[0]);
                    setTimeout(() => { window.location.href = '/api/home'; }, 800);
                })
                .catch(err => showLoginError(err.message || 'Login failed'))
                .finally(() => loginBtn.classList.remove('loading'));
        })
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name     = document.getElementById('regName').value.trim();
            const email    = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            if (!name || !email || !password) { showRegisterError('Please fill in all fields'); return; }

            registerBtn.classList.add('loading');
            const formData = new URLSearchParams({ name, email, password });

            fetch(`${API_BASE_URL}/registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            })
                .then(response => {
                    if (!response.ok) throw new Error('Registration failed');
                    // Backend redirects — no JSON body expected
                    showAlert('Account created!', 'success');
                    switchTab('login');
                })
                .catch(err => showRegisterError(err.message || 'Registration failed'))
                .finally(() => registerBtn.classList.remove('loading'));
        });
    }

    // Auto-show auth-failed banner if server flagged it
    const failed = document.getElementById('authFailedFlag')?.value;
    if (failed === 'true') showLoginError('Invalid email or password.');

    // Auto-switch to register tab if server requested it
    const regMode = document.getElementById('registerModeFlag')?.value;
    if (regMode === 'true') switchTab('register');
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    const txt = document.getElementById('loginErrorText');
    if (txt) txt.textContent = msg;
    el?.classList.remove('hidden');
}

function showRegisterError(msg) {
    const el = document.getElementById('registerError');
    const txt = document.getElementById('registerErrorText');
    if (txt) txt.textContent = msg;
    el?.classList.remove('hidden');
}

// Tab switcher on login page
function switchTab(tab) {
    const loginPanel    = document.getElementById('loginPanel');
    const registerPanel = document.getElementById('registerPanel');
    const tabs          = document.querySelectorAll('.tab');

    if (tab === 'login') {
        loginPanel?.classList.add('active');
        registerPanel?.classList.remove('active');
        tabs[0]?.classList.add('active');
        tabs[1]?.classList.remove('active');
    } else {
        registerPanel?.classList.add('active');
        loginPanel?.classList.remove('active');
        tabs[1]?.classList.add('active');
        tabs[0]?.classList.remove('active');
    }
}

// Password strength meter
function checkStrength(value) {
    const segs = [1, 2, 3, 4].map(i => document.getElementById(`seg${i}`));
    const label = document.getElementById('strengthLabel');
    const levels = [
        { test: v => v.length >= 1,                          color: '#e05252', text: 'Weak' },
        { test: v => v.length >= 6,                          color: '#e09a52', text: 'Fair' },
        { test: v => v.length >= 8 && /[A-Z]/.test(v),      color: '#d4c84a', text: 'Good' },
        { test: v => v.length >= 10 && /[^a-zA-Z0-9]/.test(v), color: '#52c46a', text: 'Strong' },
    ];
    let score = 0;
    for (const lvl of levels) { if (lvl.test(value)) score++; else break; }
    segs.forEach((s, i) => {
        if (!s) return;
        s.style.background = i < score ? levels[score - 1].color : '';
    });
    if (label) label.textContent = score > 0 ? levels[score - 1].text : '';
}

// ── Cursor (landing page)
// NOTE: make sure index.html has id="cursor" and id="cursorRing" (not just classes)
function initCursor() {
    const cursor = document.getElementById('cursor');
    const ring   = document.getElementById('cursorRing');
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
    });

    (function animate() {
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
        requestAnimationFrame(animate);
    })();
}

// ── Reveal on scroll (landing page)
function initReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.15 });
    elements.forEach(el => observer.observe(el));
}