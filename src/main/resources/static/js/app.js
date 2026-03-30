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

    checkAuthentication();

    if (document.getElementById('postsContainer')) {
        loadPosts();
        setupEventListeners();
    }

    if (document.getElementById('loginPanel')) {
        initLoginPage();
    }
});

// Setup Event Listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterAndDisplayPosts(e.target.value);
    });

    // Form submission
    document.getElementById('postForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitPost();
    });

    // Close modal on outside click
    document.getElementById('postModal').addEventListener('click', (e) => {
        if (e.target.id === 'postModal') {
            closeCreateModal();
        }
    });

    document.getElementById('viewModal').addEventListener('click', (e) => {
        if (e.target.id === 'viewModal') {
            closeViewModal();
        }
    });
}

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    currentUser = localStorage.getItem('currentUser');
    
    if (!token) {
        console.log('ℹ️ No authentication token found - user not authenticated');
    } else {
        console.log('✅ User authenticated:', currentUser);
    }
}


// Handle API Response - Process exceptions from GlobalExceptionHandler
function handleResponse(response) {
    // If response is not ok, try to parse error from GlobalExceptionHandler
    if (!response.ok) {
        return response.json().then(errorData => {
            // GlobalExceptionHandler returns: { status: number, message: string }
            const errorMessage = errorData.message || `HTTP Error ${response.status}`;
            const error = new Error(errorMessage);
            error.status = errorData.status || response.status;
            throw error;
        }).catch(jsonError => {
            // If JSON parsing fails, use generic error
            const error = new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            error.status = response.status;
            throw error;
        });
    }
    return response.json();
}

// Load posts from API
function loadPosts() {
    showLoadingSpinner();
    hideErrorMessage();

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
        hideLoadingSpinner();
        hideErrorMessage();
    })
    .catch(error => {
        console.error('❌ Error loading posts:', error);
        hideLoadingSpinner();
        showErrorMessage(error.message || 'Failed to load posts. Please try again later.');
        showEmptyState();
    });
}

// Display posts in the grid
function displayPosts(posts) {
    const postsContainer = document.getElementById('postsContainer');
    
    if (!posts || posts.length === 0) {
        showEmptyState();
        postsContainer.innerHTML = '';
        return;
    }

    hideEmptyState();
    postsContainer.innerHTML = posts.map(post => `
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
    
    console.log(`📊 Displayed ${posts.length} posts`);
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

// Sort posts
function sortPosts() {
    const sortType = document.getElementById('sortSelect').value;
    let sortedPosts = [...allPosts];

    switch (sortType) {
        case 'recent':
            sortedPosts.sort((a, b) => new Date(b.createDate) - new Date(a.createDate));
            break;
        case 'oldest':
            sortedPosts.sort((a, b) => new Date(a.createDate) - new Date(b.createDate));
            break;
        case 'likes':
            sortedPosts.sort((a, b) => b.numberOfLikes - a.numberOfLikes);
            break;
        case 'author':
            sortedPosts.sort((a, b) => a.author.localeCompare(b.author));
            break;
    }

    displayPosts(sortedPosts);
}

// View post details
function viewPost(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) {
        console.error('❌ Post not found:', postId);
        showAlert('Post not found', 'error');
        return;
    }

    currentViewingPostId = postId;
    
    // Populate modal
    document.getElementById('viewTitle').textContent = post.title;
    document.getElementById('viewAuthor').textContent = post.author;
    document.getElementById('viewDate').textContent = `📅 Posted on ${formatDate(post.createDate)}`;
    document.getElementById('viewLikes').textContent = post.numberOfLikes;
    document.getElementById('viewDislikes').textContent = post.numberOfDislikes;

    // Show/hide edit and delete buttons based on ownership
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
    if (!currentViewingPostId) {
        showAlert('No post selected', 'error');
        return;
    }

    const post = allPosts.find(p => p.id === currentViewingPostId);
    if (!post) {
        showAlert('Post not found', 'error');
        return;
    }

    const newLikes = post.numberOfLikes + 1;
    const payload = {
        title: post.title,
        numberOfLikes: newLikes,
        numberOfDislikes: post.numberOfDislikes
    };

    fetch(`${API_BASE_URL}/posts/${currentViewingPostId}`, {
        method: 'PUT',
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => handleResponse(response))
    .then(updatedPost => {
        post.numberOfLikes = newLikes;
        document.getElementById('viewLikes').textContent = newLikes;
        showAlert('Post liked! 👍', 'success');
        console.log('👍 Post liked successfully');
    })
    .catch(error => {
        console.error('❌ Error liking post:', error);
        showAlert(`Failed to like post: ${error.message}`, 'error');
    });
}

// Dislike post
function dislikePost() {
    if (!currentViewingPostId) {
        showAlert('No post selected', 'error');
        return;
    }

    const post = allPosts.find(p => p.id === currentViewingPostId);
    if (!post) {
        showAlert('Post not found', 'error');
        return;
    }

    const newDislikes = post.numberOfDislikes + 1;
    const payload = {
        title: post.title,
        numberOfLikes: post.numberOfLikes,
        numberOfDislikes: newDislikes
    };

    fetch(`${API_BASE_URL}/posts/${currentViewingPostId}`, {
        method: 'PUT',
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => handleResponse(response))
    .then(updatedPost => {
        post.numberOfDislikes = newDislikes;
        document.getElementById('viewDislikes').textContent = newDislikes;
        showAlert('Post disliked! 👎', 'success');
        console.log('👎 Post disliked successfully');
    })
    .catch(error => {
        console.error('❌ Error disliking post:', error);
        showAlert(`Failed to dislike post: ${error.message}`, 'error');
    });
}

// Edit post
function editPost() {
    const post = allPosts.find(p => p.id === currentViewingPostId);
    if (!post) {
        showAlert('Post not found', 'error');
        return;
    }

    isEditMode = true;
    editingPostId = currentViewingPostId;

    document.getElementById('modalTitle').textContent = '✏️ Edit Post';
    document.getElementById('author').value = post.author;
    document.getElementById('title').value = post.title;
    
    document.getElementById('author').disabled = true;
    document.getElementById('author').style.opacity = '0.7';

    closeViewModal();
    document.getElementById('postModal').classList.remove('hidden');
    clearFormError();
}

// Delete post
function deletePost() {
    if (!currentViewingPostId) {
        showAlert('No post selected', 'error');
        return;
    }

    if (!confirm('🗑️ Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }

    fetch(`${API_BASE_URL}/posts/${currentViewingPostId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `HTTP Error ${response.status}`);
            });
        }
        return response;
    })
    .then(() => {
        allPosts = allPosts.filter(p => p.id !== currentViewingPostId);
        closeViewModal();
        displayPosts(allPosts);
        showAlert('Post deleted successfully! 🗑️', 'success');
        console.log('🗑️ Post deleted');
    })
    .catch(error => {
        console.error('❌ Error deleting post:', error);
        showAlert(`Failed to delete post: ${error.message}`, 'error');
    });
}

// Open create modal
function openCreateModal() {
    isEditMode = false;
    editingPostId = null;
    document.getElementById('modalTitle').textContent = '✏️ Create New Post';
    document.getElementById('postForm').reset();
    document.getElementById('author').disabled = false;
    document.getElementById('author').style.opacity = '1';
    clearFormError();
    
    // Set author from currentUser if available
    if (currentUser) {
        document.getElementById('author').value = currentUser;
    }

    document.getElementById('postModal').classList.remove('hidden');
}

// Close create modal
function closeCreateModal() {
    document.getElementById('postModal').classList.add('hidden');
    document.getElementById('postForm').reset();
    isEditMode = false;
    editingPostId = null;
    clearFormError();
}

// Submit post (create or update)
function submitPost() {
    const author = document.getElementById('author').value.trim();
    const title = document.getElementById('title').value.trim();
    const submitBtn = document.getElementById('submitBtn');

    // Client-side validation
    let errors = [];

    if (!author || !title) {
        errors.push('⚠️ Please fill in all fields (Author and Title)');
    }

    if (author && author.length > 20) {
        errors.push('⚠️ Author name must be less than 20 characters');
    }

    if (title && title.length > 100) {
        errors.push('⚠️ Title must be less than 100 characters');
    }

    if (errors.length > 0) {
        showFormError(errors.join('\n'));
        return;
    }

    clearFormError();
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    if (isEditMode) {
        const post = allPosts.find(p => p.id === editingPostId);
        if (!post) {
            showFormError('❌ Post not found');
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            return;
        }
        updatePostTitle(editingPostId, title, post.numberOfLikes, post.numberOfDislikes, submitBtn);
    } else {
        createNewPost(author, title, submitBtn);
    }
}

// Create new post
function createNewPost(author, title, submitBtn) {
    const payload = {
        author: author,
        title: title
    };

    console.log('📝 Creating post:', payload);

    fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => handleResponse(response))
    .then(newPost => {
        console.log('✅ Post created successfully:', newPost);
        closeCreateModal();
        loadPosts();
        showAlert('🎉 Post created successfully!', 'success');
    })
    .catch(error => {
        console.error('❌ Error creating post:', error);
        showFormError(`❌ Failed to create post: ${error.message}`);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    });
}

// Update existing post title and stats
function updatePostTitle(postId, title, numberOfLikes, numberOfDislikes, submitBtn) {
    const payload = {
        title: title,
        numberOfLikes: numberOfLikes,
        numberOfDislikes: numberOfDislikes
    };

    console.log('📝 Updating post:', postId, payload);

    fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => handleResponse(response))
    .then(updatedPost => {
        console.log('✅ Post updated successfully:', updatedPost);
        closeCreateModal();
        loadPosts();
        showAlert('🎉 Post updated successfully!', 'success');
    })
    .catch(error => {
        console.error('❌ Error updating post:', error);
        showFormError(`❌ Failed to update post: ${error.message}`);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    });
}

// Logout
function logout() {
    if (confirm('🚪 Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        currentUser = null;
        showAlert('✅ Logged out successfully', 'success');
        // Redirect to login page or main page
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }
}

// Get authorization header for API calls
function getAuthHeader() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        return `Bearer ${token}`;
    }
    return '';
}

// Utility Functions

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

function showEmptyState() {
    document.getElementById('emptyState').classList.remove('hidden');
}

function hideEmptyState() {
    document.getElementById('emptyState').classList.add('hidden');
}

function showErrorMessage(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = `
        <span>${message}</span>
        <span class="error-close" onclick="hideErrorMessage()">&times;</span>
    `;
    errorDiv.classList.remove('hidden');
}

// Hide error message
function hideErrorMessage() {
    document.getElementById('errorMessage').classList.add('hidden');
}

// Show form error in modal
function showFormError(message) {
    const formError = document.getElementById('formError');
    formError.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <span class="form-error-close" onclick="clearFormError()" title="Close">&times;</span>
    `;
    formError.classList.remove('hidden');
}

// Clear form error
function clearFormError() {
    const formError = document.getElementById('formError');
    formError.classList.add('hidden');
}

// Show alert notification (top-right corner)
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <span class="alert-close" onclick="this.parentElement.remove()">&times;</span>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.classList.add('removing');
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
}

// ============================================
// FORMAT UTILITIES
// ============================================

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString;
    }
}

// Escape HTML special characters (XSS prevention)
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Add CSS animation styles to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


function initLoginPage() {
    console.log('🔐 Login page initialized');

    const loginForm = document.getElementById('loginPanel');
    const registerForm = document.getElementById('registerPanel');

    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    // LOGIN
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                showLoginError('Please fill all fields');
                return;
            }

            loginBtn.classList.add('loading');

            fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
                .then(response => handleResponse(response))
                .then(data => {
                    console.log('✅ Login success', data);

                    // сохраняем токен
                    if (data.token) {
                        localStorage.setItem('authToken', data.token);
                    }

                    if (data.user) {
                        localStorage.setItem('currentUser', data.user.name);
                    }

                    showAlert('Login successful', 'success');

                    setTimeout(() => {
                        window.location.href = '/api/home';
                    }, 800);
                })
                .catch(err => {
                    console.error(err);
                    showLoginError(err.message || 'Login failed');
                })
                .finally(() => {
                    loginBtn.classList.remove('loading');
                });
        });
    }

    // REGISTER
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;

            if (!name || !email || !password) {
                showRegisterError('Please fill all fields');
                return;
            }

            registerBtn.classList.add('loading');

            fetch(`${API_BASE_URL}/registration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            })
                .then(response => handleResponse(response))
                .then(data => {
                    console.log('✅ Register success', data);

                    showAlert('Account created!', 'success');
                    switchTab('login');
                })
                .catch(err => {
                    console.error(err);
                    showRegisterError(err.message || 'Registration failed');
                })
                .finally(() => {
                    registerBtn.classList.remove('loading');
                });
        });
    }
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    const text = document.getElementById('loginErrorText');

    text.textContent = msg;
    el.classList.remove('hidden');
}

function showRegisterError(msg) {
    const el = document.getElementById('registerError');
    const text = document.getElementById('registerErrorText');

    text.textContent = msg;
    el.classList.remove('hidden');
}

