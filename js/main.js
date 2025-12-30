/**
 * Portfolio JavaScript
 * Handles GitHub API integration, interactive features, and UI enhancements
 */

// Configuration
const CONFIG = {
    githubUsername: 'ravingodbole',
    apiBaseUrl: 'https://api.github.com',
    maxProjects: 12,
    animationDelay: 100
};

// State management
const state = {
    allProjects: [],
    currentFilter: 'all',
    isLoading: false
};

// ==========================================================================
// GitHub API Functions
// ==========================================================================

/**
 * Fetches user data from GitHub API
 * @returns {Promise<Object>} User data object
 */
async function fetchGitHubUser() {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/users/${CONFIG.githubUsername}`);
        if (!response.ok) throw new Error('Failed to fetch user data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching GitHub user:', error);
        throw error;
    }
}

/**
 * Fetches repositories from GitHub API
 * @returns {Promise<Array>} Array of repository objects
 */
async function fetchGitHubRepos() {
    try {
        const response = await fetch(
            `${CONFIG.apiBaseUrl}/users/${CONFIG.githubUsername}/repos?sort=updated&per_page=100`
        );
        if (!response.ok) throw new Error('Failed to fetch repositories');
        return await response.json();
    } catch (error) {
        console.error('Error fetching repositories:', error);
        throw error;
    }
}

/**
 * Main function to fetch and display all GitHub data
 */
async function fetchGitHubData() {
    if (state.isLoading) return;
    
    state.isLoading = true;
    showLoading();
    
    try {
        // Fetch user data and repositories in parallel
        const [userData, reposData] = await Promise.all([
            fetchGitHubUser(),
            fetchGitHubRepos()
        ]);
        
        // Update stats
        updateStats(userData, reposData);
        
        // Store and display projects
        state.allProjects = reposData;
        displayProjects(reposData);
        
    } catch (error) {
        showError('Failed to load GitHub data. Please try again later.');
        console.error('GitHub API Error:', error);
    } finally {
        state.isLoading = false;
    }
}

/**
 * Updates the statistics display
 * @param {Object} userData - GitHub user data
 * @param {Array} reposData - Array of repository objects
 */
function updateStats(userData, reposData) {
    const stats = {
        repos: userData.public_repos,
        followers: userData.followers,
        stars: reposData.reduce((sum, repo) => sum + repo.stargazers_count, 0),
        forks: reposData.reduce((sum, repo) => sum + repo.forks_count, 0)
    };
    
    animateNumber('repoCount', stats.repos);
    animateNumber('followerCount', stats.followers);
    animateNumber('totalStars', stats.stars);
    animateNumber('totalForks', stats.forks);
}

/**
 * Animates a number counting up
 * @param {string} elementId - ID of the element to animate
 * @param {number} targetValue - Final value to count to
 */
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 1000;
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

// ==========================================================================
// Project Display Functions
// ==========================================================================

/**
 * Displays projects in the grid
 * @param {Array} projects - Array of project objects to display
 */
function displayProjects(projects) {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    
    if (projects.length === 0) {
        container.innerHTML = '<p class="no-projects">No projects found matching your criteria.</p>';
        return;
    }
    
    // Limit to configured maximum
    const displayProjects = projects.slice(0, CONFIG.maxProjects);
    
    container.innerHTML = displayProjects
        .map((project, index) => createProjectCard(project, index))
        .join('');
    
    // Add staggered animation
    animateProjects();
}

/**
 * Creates HTML for a single project card
 * @param {Object} project - Project data object
 * @param {number} index - Index for animation delay
 * @returns {string} HTML string for project card
 */
function createProjectCard(project, index) {
    const language = project.language || 'Unknown';
    const description = project.description || 'No description available';
    const stars = project.stargazers_count;
    const forks = project.forks_count;
    
    return `
        <article class="project-card" 
                 data-language="${language.toLowerCase()}" 
                 style="animation-delay: ${index * CONFIG.animationDelay}ms"
                 role="listitem">
            <div class="project-header">
                <h3 class="project-title">
                    <span aria-hidden="true">📦</span>
                    <span>${escapeHtml(project.name)}</span>
                </h3>
                <p class="project-description">${escapeHtml(description)}</p>
            </div>
            <div class="project-footer">
                <div class="project-tech">
                    ${language !== 'Unknown' ? `<span class="tech-badge">${escapeHtml(language)}</span>` : ''}
                    ${stars > 0 ? `<span class="tech-badge" aria-label="${stars} stars">⭐ ${stars}</span>` : ''}
                    ${forks > 0 ? `<span class="tech-badge" aria-label="${forks} forks">🔀 ${forks}</span>` : ''}
                </div>
                <div class="project-links">
                    <a href="${project.html_url}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="project-link" 
                       aria-label="View ${project.name} on GitHub"
                       title="View on GitHub">
                        🔗
                    </a>
                    ${project.homepage ? `
                        <a href="${project.homepage}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="project-link" 
                           aria-label="View ${project.name} live demo"
                           title="Live Demo">
                            🚀
                        </a>
                    ` : ''}
                </div>
            </div>
        </article>
    `;
}

/**
 * Filters projects based on selected category
 * @param {string} filter - Filter category
 */
function filterProjects(filter) {
    state.currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const isActive = btn.dataset.filter === filter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    
    // Filter projects
    let filteredProjects = state.allProjects;
    
    if (filter !== 'all') {
        filteredProjects = state.allProjects.filter(project => 
            project.language && project.language.toLowerCase().includes(filter.toLowerCase())
        );
    }
    
    displayProjects(filteredProjects);
}

/**
 * Animates project cards on display
 */
function animateProjects() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = 'fadeInUp 0.6s ease-out forwards';
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// ==========================================================================
// UI Helper Functions
// ==========================================================================

/**
 * Shows loading state
 */
function showLoading() {
    const container = document.getElementById('projectsContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading" role="status" aria-live="polite">
                <div class="spinner" aria-hidden="true"></div>
                <p>Loading projects from GitHub...</p>
            </div>
        `;
    }
}

/**
 * Shows error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const container = document.getElementById('projectsContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-message" role="alert">
                <p style="text-align: center; color: #ff6b6b;">${escapeHtml(message)}</p>
            </div>
        `;
    }
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================================================
// Resume Upload Handler
// ==========================================================================

/**
 * Handles resume file upload
 */
function handleResumeUpload() {
    const fileInput = document.getElementById('resumeUpload');
    const status = document.getElementById('uploadStatus');
    const downloadBtn = document.getElementById('downloadResume');
    
    if (!fileInput || !status || !downloadBtn) return;
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (!file) return;
        
        // Validate file type
        if (file.type !== 'application/pdf') {
            status.textContent = '❌ Please upload a PDF file';
            status.style.color = '#ff6b6b';
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            status.textContent = '❌ File size must be less than 5MB';
            status.style.color = '#ff6b6b';
            return;
        }
        
        // Create download URL
        const url = URL.createObjectURL(file);
        downloadBtn.href = url;
        downloadBtn.download = file.name;
        
        // Show success message
        status.textContent = `✓ Uploaded: ${file.name}`;
        status.style.color = '#43e97b';
        
        // Cleanup old URL after a delay
        setTimeout(() => {
            if (downloadBtn.href !== url) {
                URL.revokeObjectURL(url);
            }
        }, 60000);
    });
}

// ==========================================================================
// Navigation Functions
// ==========================================================================

/**
 * Handles smooth scrolling for navigation links
 */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                const navHeight = document.querySelector('nav').offsetHeight;
                const targetPosition = target.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Handles mobile menu toggle
 */
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!toggle || !navLinks) return;
    
    toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !isExpanded);
        navLinks.classList.toggle('active');
    });
    
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
}

/**
 * Handles back to top button
 */
function initBackToTop() {
    const button = document.getElementById('backToTop');
    if (!button) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    });
    
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Handles navbar hide/show on scroll
 */
function initNavbarScroll() {
    const nav = document.querySelector('nav');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > lastScroll && currentScroll > 100) {
            nav.classList.add('hidden');
        } else {
            nav.classList.remove('hidden');
        }
        
        lastScroll = currentScroll;
    });
}

// ==========================================================================
// Project Filter Event Listeners
// ==========================================================================

/**
 * Initialize project filter buttons
 */
function initProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            filterProjects(filter);
        });
    });
}

// ==========================================================================
// Initialization
// ==========================================================================

/**
 * Initialize all functionality when DOM is ready
 */
function init() {
    // Fetch GitHub data
    fetchGitHubData();
    
    // Initialize UI features
    initSmoothScrolling();
    initMobileMenu();
    initBackToTop();
    initNavbarScroll();
    initProjectFilters();
    handleResumeUpload();
    
    // Log initialization
    console.log('Portfolio initialized successfully');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchGitHubData,
        filterProjects,
        displayProjects
    };
}