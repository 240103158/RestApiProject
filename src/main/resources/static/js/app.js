const API = '/api';
let allPosts = [];
let currentViewingId = null;
let pendingDeleteId = null;
let isEditMode = false;
let editingId = null;
let currentUser = null;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUser();

    if (!currentUser) {
        renderGuestState();
        return;
    }

    loadPosts();

    document.getElementById('searchInput').addEventListener('input', e => {
        filterPosts(e.target.value);
    });

    document.getElementById('createModal').addEventListener('click', e => {
        if (e.target.id === 'createModal') closeCreateModal();
    });
    document.getElementById('viewModal').addEventListener('click', e => {
        if (e.target.id === 'viewModal') closeViewModal();
    });
    document.getElementById('confirmModal').addEventListener('click', e => {
        if (e.target.id === 'confirmModal') closeConfirmModal();
    });

    document.getElementById('postTitleInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') submitPost();
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        if (pendingDeleteId != null) executeDelete(pendingDeleteId);
    });
});

// ── CURRENT USER ──
function loadCurrentUser() {
    const meta = document.querySelector('meta[name="current-user"]');
    if (meta && meta.content && meta.content.trim() !== '') {
        currentUser = { name: meta.content, email: meta.content };
        document.getElementById('userNameDisplay').textContent = meta.content;
        document.getElementById('userAvatar').textContent = meta.content.charAt(0).toUpperCase();
    } else {
        currentUser = null;
        document.getElementById('userNameDisplay').textContent = 'Guest';
        document.getElementById('userAvatar').textContent = '?';
        // swap Sign out → Sign in link
        const signOutBtn = document.querySelector('.btn-ghost[onclick="logout()"]');
        if (signOutBtn) {
            signOutBtn.textContent = 'Sign in';
            signOutBtn.removeAttribute('onclick');
            signOutBtn.addEventListener('click', () => { window.location.href = '/api/login'; });
        }
        // hide New Post button
        const newPostBtn = document.querySelector('.btn-primary[onclick="openCreateModal()"]');
        if (newPostBtn) newPostBtn.style.display = 'none';
    }
}

// ── GUEST STATE ──
function renderGuestState() {
    document.getElementById('postCount').textContent = '';
    document.getElementById('postsGrid').innerHTML = `
        <div class="state-box" style="gap:20px;padding:60px 32px;">
            <div style="font-size:52px;">👋</div>
            <div class="state-title">Welcome to The Blog</div>
            <p class="state-sub" style="max-width:380px;">
                Sign in to read posts, write your own, like or dislike others, and manage your content.
            </p>

            <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:4px;">
                <a href="/api/login" class="btn btn-primary">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M8.5 2.5h2a1 1 0 011 1v6a1 1 0 01-1 1h-2M5.5 9.5l3-3-3-3M8.5 6.5H1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Sign In
                </a>
                <a href="/api/registration" class="btn btn-ghost">Create Account</a>
            </div>

            <div style="width:100%;max-width:480px;margin-top:12px;border:1.5px solid var(--border);border-radius:12px;overflow:hidden;">
                <div style="background:var(--accent-lt);border-bottom:1.5px solid #c7d2fe;padding:12px 20px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--accent);">How it works</span>
                </div>
                <div style="padding:0;">
                    ${[
                        ['✍️', 'Create an account', 'Sign up with your name, email and password.'],
                        ['📝', 'Write a post',       'Give your post a title and publish instantly.'],
                        ['👍', 'React to posts',     'Like or dislike any post you read.'],
                        ['🗑️', 'Manage your posts',  'Edit or delete posts you own at any time.'],
                    ].map(([icon, title, desc], i, arr) => `
                        <div style="display:flex;align-items:flex-start;gap:14px;padding:16px 20px;${i < arr.length-1 ? 'border-bottom:1px solid var(--border);' : ''}">
                            <span style="font-size:20px;flex-shrink:0;margin-top:1px;">${icon}</span>
                            <div>
                                <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:2px;">${title}</div>
                                <div style="font-size:12.5px;color:var(--ink-3);line-height:1.5;">${desc}</div>
                            </div>
                        </div>`).join('')}
                </div>
            </div>
        </div>`;
}

// ── POSTS ──
function loadPosts() {
    document.getElementById('postsGrid').innerHTML = `
        <div class="state-box">
            <div class="spinner"></div>
            <p class="state-sub">Loading posts…</p>
        </div>`;

    fetch(`${API}/posts`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': getAuthHeader() }
    })
    .then(r => handleResponse(r))
    .then(data => {
        allPosts = data.posts || data || [];
        renderPosts(allPosts);
    })
    .catch(err => renderError(err.message || 'Failed to load posts.'));
}

function renderPosts(posts) {
    const grid = document.getElementById('postsGrid');

    if (!posts || posts.length === 0) {
        grid.innerHTML = `
            <div class="state-box">
                <div class="state-icon">📭</div>
                <div class="state-title">No posts yet</div>
                <p class="state-sub">Be the first to write something.</p>
                <button class="btn btn-primary" onclick="openCreateModal()" style="margin-top:4px;">Write a post</button>
            </div>`;
        document.getElementById('postCount').textContent = '';
        return;
    }

    document.getElementById('postCount').textContent =
        `${posts.length} post${posts.length !== 1 ? 's' : ''}`;

    grid.innerHTML = posts.map(post => {
        const initials = (post.author || '?').charAt(0).toUpperCase();
        const isOwn = currentUser && (currentUser.name === post.author || currentUser.email === post.author);
        const deleteBtn = isOwn ? `
            <button class="card-delete-btn" onclick="promptDeletePost(${post.id}, event)" title="Delete post">
                <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                    <path d="M1.5 3.5h10M4.5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 6v4M7.5 6v4M2.5 3.5l.7 7a1 1 0 001 .9h4.6a1 1 0 001-.9l.7-7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>` : '';

        return `
            <div class="post-card" onclick="viewPost(${post.id})">
                ${deleteBtn}
                <div class="post-card-accent"></div>
                <div class="post-card-body">
                    <h3 class="post-title">${escHtml(post.title)}</h3>
                    <div class="post-meta">
                        <div class="post-avatar">${initials}</div>
                        <span class="post-author-name">${escHtml(post.author)}</span>
                        <div class="meta-dot"></div>
                        <span>${fmtDate(post.createdDate)}</span>
                    </div>
                </div>
                <div class="post-card-footer">
                    <div class="post-reactions">
                        <span class="reaction">👍 ${post.numberOfLikes}</span>
                        <span class="reaction">👎 ${post.numberOfDislikes}</span>
                    </div>
                    <span class="post-arrow">→</span>
                </div>
            </div>`;
    }).join('');
}

function renderError(msg) {
    document.getElementById('postsGrid').innerHTML = `
        <div class="state-box">
            <div class="state-icon">⚠️</div>
            <div class="state-title">Something went wrong</div>
            <p class="state-sub">${escHtml(msg)}</p>
            <button class="btn btn-primary" onclick="loadPosts()" style="margin-top:4px;">Try again</button>
        </div>`;
}

function filterPosts(term) {
    if (!term.trim()) { renderPosts(allPosts); return; }
    const t = term.toLowerCase();
    renderPosts(allPosts.filter(p =>
        p.title.toLowerCase().includes(t) || (p.author || '').toLowerCase().includes(t)
    ));
}

function sortPosts() {
    const val = document.getElementById('sortSelect').value;
    const sorted = [...allPosts];
    if (val === 'recent') sorted.sort((a,b) => new Date(b.createdDate) - new Date(a.createdDate));
    if (val === 'oldest') sorted.sort((a,b) => new Date(a.createdDate) - new Date(b.createdDate));
    if (val === 'likes')  sorted.sort((a,b) => b.numberOfLikes - a.numberOfLikes);
    if (val === 'author') sorted.sort((a,b) => (a.author||'').localeCompare(b.author||''));
    renderPosts(sorted);
}

// ── VIEW POST ──
function viewPost(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;
    currentViewingId = id;

    document.getElementById('viewPostTitle').textContent = post.title;
    document.getElementById('viewAuthor').textContent = post.author || 'Unknown';
    document.getElementById('viewAuthorAvatar').textContent = (post.author || '?').charAt(0).toUpperCase();
    document.getElementById('viewDate').textContent = fmtDate(post.createdDate);
    document.getElementById('viewLikes').textContent = post.numberOfLikes;
    document.getElementById('viewDislikes').textContent = post.numberOfDislikes;

    const isOwn = currentUser && (currentUser.name === post.author || currentUser.email === post.author);
    document.getElementById('editBtn').style.display   = isOwn ? 'inline-flex' : 'none';
    document.getElementById('deleteBtn').style.display = isOwn ? 'inline-flex' : 'none';

    document.getElementById('viewModal').classList.remove('hidden');
}

function closeViewModal() {
    document.getElementById('viewModal').classList.add('hidden');
    currentViewingId = null;
}

// ── LIKE / DISLIKE ──
function likePost() {
    const post = allPosts.find(p => p.id === currentViewingId);
    if (!post) return;
    patchReactions(post, post.numberOfLikes + 1, post.numberOfDislikes);
}

function dislikePost() {
    const post = allPosts.find(p => p.id === currentViewingId);
    if (!post) return;
    patchReactions(post, post.numberOfLikes, post.numberOfDislikes + 1);
}

function patchReactions(post, likes, dislikes) {
    fetch(`${API}/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: post.title, numberOfLikes: likes, numberOfDislikes: dislikes })
    })
    .then(r => handleResponse(r))
    .then(() => {
        post.numberOfLikes = likes;
        post.numberOfDislikes = dislikes;
        document.getElementById('viewLikes').textContent = likes;
        document.getElementById('viewDislikes').textContent = dislikes;
        showToast('Reaction saved', 'success', '👍');
    })
    .catch(err => showToast(err.message, 'error', '⚠️'));
}

// ── CREATE / EDIT ──
function openCreateModal() {
    isEditMode = false;
    editingId = null;
    document.getElementById('createModalTitle').textContent = 'New Post';
    document.getElementById('postTitleInput').value = '';
    hideFormError();
    document.getElementById('createModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('postTitleInput').focus(), 50);
}

function editPost() {
    const post = allPosts.find(p => p.id === currentViewingId);
    if (!post) return;
    isEditMode = true;
    editingId = currentViewingId;

    document.getElementById('createModalTitle').textContent = 'Edit Post';
    document.getElementById('postTitleInput').value = post.title;
    hideFormError();

    closeViewModal();
    document.getElementById('createModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('postTitleInput').focus(), 50);
}

function closeCreateModal() {
    document.getElementById('createModal').classList.add('hidden');
    isEditMode = false;
    editingId = null;
    hideFormError();
}

function submitPost() {
    const title = document.getElementById('postTitleInput').value.trim();
    const btn   = document.getElementById('createSubmitBtn');

    if (!title) { showFormError('Please enter a post title.'); return; }
    if (title.length > 100) { showFormError('Title must be under 100 characters.'); return; }

    hideFormError();
    btn.classList.add('loading');
    btn.textContent = 'Saving…';

    const isEdit = isEditMode;
    const id     = editingId;

    const body = isEdit
        ? (() => { const p = allPosts.find(x => x.id === id); return JSON.stringify({ title, numberOfLikes: p.numberOfLikes, numberOfDislikes: p.numberOfDislikes }); })()
        : JSON.stringify({ title });

    fetch(`${API}/posts${isEdit ? '/'+id : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        body
    })
    .then(r => handleResponse(r))
    .then(() => {
        closeCreateModal();
        loadPosts();
        showToast(isEdit ? 'Post updated' : 'Post created!', 'success', isEdit ? '✏️' : '🎉');
    })
    .catch(err => showFormError(err.message))
    .finally(() => { btn.classList.remove('loading'); btn.textContent = 'Save Post'; });
}

// ── DELETE (from view modal) ──
function deletePost() {
    if (!currentViewingId) return;
    pendingDeleteId = currentViewingId;
    closeViewModal();
    document.getElementById('confirmModal').classList.remove('hidden');
}

// ── DELETE (from card) ──
function promptDeletePost(id, event) {
    event.stopPropagation();
    pendingDeleteId = id;
    document.getElementById('confirmModal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    pendingDeleteId = null;
}

function executeDelete(id) {
    const btn = document.getElementById('confirmDeleteBtn');
    btn.classList.add('loading');

    fetch(`${API}/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': getAuthHeader() }
    })
    .then(r => { if (!r.ok) throw new Error('Delete failed'); })
    .then(() => {
        allPosts = allPosts.filter(p => p.id !== id);
        closeConfirmModal();
        renderPosts(allPosts);
        showToast('Post deleted', 'success', '🗑️');
    })
    .catch(err => {
        closeConfirmModal();
        showToast(err.message, 'error', '⚠️');
    })
    .finally(() => { btn.classList.remove('loading'); });
}

// ── LOGOUT ──
function logout() {
    if (!confirm('Sign out?')) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    const csrfMeta = document.querySelector('meta[name="_csrf"]');
    if (csrfMeta) {
        const input = document.createElement('input');
        input.type  = 'hidden';
        input.name  = '_csrf';
        input.value = csrfMeta.content;
        form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
}

// ── HELPERS ──
function handleResponse(r) {
    if (!r.ok) {
        return r.json().then(d => {
            const err = new Error(d.message || `Error ${r.status}`);
            err.status = r.status;
            throw err;
        }).catch(e => { if (e.status) throw e; throw new Error(`Error ${r.status}`); });
    }
    const ct = r.headers.get('content-type') || '';
    return ct.includes('application/json') ? r.json() : r.text();
}

function getAuthHeader() {
    const t = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return t ? `Bearer ${t}` : '';
}

function showFormError(msg) {
    document.getElementById('createFormErrorText').textContent = msg;
    document.getElementById('createFormError').classList.remove('hidden');
}

function hideFormError() {
    document.getElementById('createFormError').classList.add('hidden');
}

function showToast(msg, type = 'info', icon = 'ℹ️') {
    const stack = document.getElementById('toastStack');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <span>${escHtml(msg)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
    stack.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4500);
}

function fmtDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }); }
    catch { return d; }
}

function escHtml(s) {
    if (!s) return '';
    return String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
