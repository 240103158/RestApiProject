// ============================================
// BLOG POSTS FRONTEND - API Integration
// ============================================

// API Configuration
const API_BASE_URL = '/api';
let allPosts = [];
let currentViewingPostId = null;
let isEditMode = false;
let editingPostId = null;
let currentUser = null;

// ============================================
// INITIALIZATION
// ============================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    checkAuthentication();
    loadPosts();
    setupEventListeners();
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
        console.log('No authentication token found - user not authenticated');
    } else {
        console.log('User authenticated:', currentUser);
    }
}

// Load posts from API
function loadPosts() {
    showLoadingSpinner();
    hideErrorMessage();

    fetch(`${API_BASE_URL}/posts`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allPosts = data.posts || [];
            displayPosts(allPosts);
            hideLoadingSpinner();
        })
        .catch(error => {
            console.error('Error loading posts:', error);
            showErrorMessage('Failed to load posts. Please try again later.');
            hideLoadingSpinner();
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
        console.error('Post not found:', postId);
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
}

// Close view modal
function closeViewModal() {
    document.getElementById('viewModal').classList.add('hidden');
    currentViewingPostId = null;
}

// Like post
function likePost() {
    if (!currentViewingPostId) {
        showErrorMessage('No post selected');
        return;
    }

    const post = allPosts.find(p => p.id === currentViewingPostId);
    if (!post) {
        showErrorMessage('Post not found');
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
    .then(response => {
        if (!response.ok) throw new Error('Failed to like post');
        return response.json();
    })
    .then(updatedPost => {
        post.numberOfLikes = newLikes;
        document.getElementById('viewLikes').textContent = newLikes;
        showNotification('Post liked! 👍');
    })
    .catch(error => {
        console.error('Error liking post:', error);
        showErrorMessage('Failed to like post');
    });
}

// Dislike post
function dislikePost() {
    if (!currentViewingPostId) {
        showErrorMessage('No post selected');
        return;
    }

    const post = allPosts.find(p => p.id === currentViewingPostId);
    if (!post) {
        showErrorMessage('Post not found');
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
    .then(response => {
        if (!response.ok) throw new Error('Failed to dislike post');
        return response.json();
    })
    .then(updatedPost => {
        post.numberOfDislikes = newDislikes;
        document.getElementById('viewDislikes').textContent = newDislikes;
        showNotification('Post disliked! 👎');
    })
    .catch(error => {
        console.error('Error disliking post:', error);
        showErrorMessage('Failed to dislike post');
    });
}

// Edit post
function editPost() {
    const post = allPosts.find(p => p.id === currentViewingPostId);
    if (!post) return;

    isEditMode = true;
    editingPostId = currentViewingPostId;

    document.getElementById('modalTitle').textContent = 'Edit Post';
    document.getElementById('author').value = post.author;
    document.getElementById('title').value = post.title;
    
    document.getElementById('author').disabled = true;
    document.getElementById('author').style.opacity = '0.7';

    closeViewModal();
    document.getElementById('postModal').classList.remove('hidden');
}

// Delete post
function deletePost() {
    if (!currentViewingPostId) return;

    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
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
        if (!response.ok) throw new Error('Failed to delete post');
        
        allPosts = allPosts.filter(p => p.id !== currentViewingPostId);
        closeViewModal();
        displayPosts(allPosts);
        showNotification('Post deleted successfully! 🗑️');
    })
    .catch(error => {
        console.error('Error deleting post:', error);
        showErrorMessage('Failed to delete post');
    });
}

// Open create modal
function openCreateModal() {
    isEditMode = false;
    editingPostId = null;
    document.getElementById('modalTitle').textContent = 'Create New Post';
    document.getElementById('postForm').reset();
    document.getElementById('author').disabled = false;
    document.getElementById('author').style.opacity = '1';
    
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
}

// Submit post (create or update)
function submitPost() {
    const author = document.getElementById('author').value.trim();
    const title = document.getElementById('title').value.trim();

    if (!author || !title) {
        showErrorMessage('Please fill in all fields (Author and Title)');
        return;
    }

    if (author.length > 20) {
        showErrorMessage('Author name must be less than 20 characters');
        return;
    }

    if (title.length > 100) {
        showErrorMessage('Title must be less than 100 characters');
        return;
    }

    if (isEditMode) {
        const post = allPosts.find(p => p.id === editingPostId);
        if (!post) {
            showErrorMessage('Post not found');
            return;
        }
        updatePostTitle(editingPostId, title, post.numberOfLikes, post.numberOfDislikes);
    } else {
        createNewPost(author, title);
    }
}

// Create new post
function createNewPost(author, title) {
    const payload = {
        author: author,
        title: title
    };

    console.log('Creating post:', payload);

    fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Failed to create post: ${text}`);
            });
        }
        return response.json();
    })
    .then(newPost => {
        console.log('Post created successfully:', newPost);
        closeCreateModal();
        loadPosts();
        showNotification('Post created successfully! ✨');
    })
    .catch(error => {
        console.error('Error creating post:', error);
        showErrorMessage(`Failed to create post: ${error.message}`);
    });
}

// Update existing post title and stats
function updatePostTitle(postId, title, numberOfLikes, numberOfDislikes) {
    const payload = {
        title: title,
        numberOfLikes: numberOfLikes,
        numberOfDislikes: numberOfDislikes
    };

    console.log('Updating post:', postId, payload);

    fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Failed to update post: ${text}`);
            });
        }
        return response.json();
    })
    .then(updatedPost => {
        console.log('Post updated successfully:', updatedPost);
        closeCreateModal();
        loadPosts();
        showNotification('Post updated successfully! ✏️');
    })
    .catch(error => {
        console.error('Error updating post:', error);
        showErrorMessage(`Failed to update post: ${error.message}`);
    });
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        currentUser = null;
        // Redirect to login page or main page
        window.location.href = '/login';
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

function hideErrorMessage() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function showNotification(message) {
    // Simple notification (you can enhance this with a proper notification library)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
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

