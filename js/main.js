// Main JavaScript File - Core Functionality

// Theme Management
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
        this.setupToggle();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateToggleIcon();
    }

    updateToggleIcon() {
        const icons = document.querySelectorAll('.theme-icon');
        icons.forEach(icon => {
            icon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    setupToggle() {
        const toggleButtons = document.querySelectorAll('#themeToggle');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', () => this.toggleTheme());
        });
    }
}

// Question Manager
class QuestionManager {
    constructor(category, dataFile) {
        this.category = category;
        this.dataFile = dataFile;
        this.questions = [];
        this.searchFilter = new SearchFilter();
        this.init();
    }

    async init() {
        await this.loadQuestions();
        this.setupEventListeners();
        this.renderQuestions();
        this.updateStats();
    }

    async loadQuestions() {
        try {
            const response = await fetch(this.dataFile);
            this.questions = await response.json();
            this.searchFilter.setQuestions(this.questions);
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showError();
        }
    }

    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('questionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterQuestions();
            });
        }

        // Difficulty filter
        const difficultyFilter = document.getElementById('difficultyFilter');
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', (e) => {
                this.filterQuestions();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterQuestions();
            });
        }

        // Bookmarked filter
        const bookmarkedBtn = document.getElementById('bookmarkedFilter');
        if (bookmarkedBtn) {
            bookmarkedBtn.addEventListener('click', () => {
                bookmarkedBtn.classList.toggle('active');
                this.filterQuestions();
            });
        }

        // Modal
        this.setupModal();
    }

    filterQuestions() {
        const searchTerm = document.getElementById('questionSearch')?.value || '';
        const difficulty = document.getElementById('difficultyFilter')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        const bookmarked = document.getElementById('bookmarkedFilter')?.classList.contains('active') || false;

        this.searchFilter.updateFilter('search', searchTerm);
        this.searchFilter.updateFilter('difficulty', difficulty);
        this.searchFilter.updateFilter('category', category);
        this.searchFilter.updateFilter('bookmarked', bookmarked);

        this.renderQuestions();
    }

    renderQuestions() {
        const container = document.getElementById('questionsContainer');
        if (!container) return;

        const questions = this.searchFilter.filteredQuestions;

        if (questions.length === 0) {
            container.innerHTML = '<div class="no-results">No questions found matching your criteria.</div>';
            return;
        }

        container.innerHTML = questions.map(q => this.renderQuestionCard(q)).join('');
        this.updateStats();
    }

    renderQuestionCard(question) {
        const status = progressTracker.getQuestionStatus(this.category, question.id);
        const isBookmarked = progressTracker.isBookmarked(this.category, question.id);

        return `
            <div class="question-item" data-id="${question.id}">
                <div class="question-header">
                    <div class="question-title-section">
                        <h3 class="question-title">${question.title}</h3>
                        <div class="question-meta">
                            <span class="difficulty-badge difficulty-${question.difficulty}">${question.difficulty}</span>
                            <span class="category-badge">${question.category}</span>
                        </div>
                    </div>
                    <div class="question-actions">
                        <button class="action-btn bookmark-btn ${isBookmarked ? 'active' : ''}" 
                                onclick="toggleBookmark('${question.id}', event)">
                            ${isBookmarked ? '⭐' : '🔖'}
                        </button>
                        <button class="action-btn status-btn ${status.status}" 
                                onclick="cycleStatus('${question.id}', event)">
                            ${this.getStatusIcon(status.status)}
                        </button>
                    </div>
                </div>
                <p class="question-description">${question.description}</p>
                <div class="question-tags">
                    ${question.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }

    getStatusIcon(status) {
        switch(status) {
            case 'solved': return '✅ Solved';
            case 'attempted': return '⏱️ Attempted';
            default: return '⭕ Unsolved';
        }
    }

    updateStats() {
        const categoryTotals = {
            'c-programming': 22,
            'zoho-dsa': 50,
            'lld': 18,
            'zoho-docs': 10
        };

        const total = categoryTotals[this.category] || this.questions.length;
        const stats = progressTracker.getCategoryStats(this.category, total);

        const totalCountEl = document.getElementById('totalCount');
        const solvedCountEl = document.getElementById('solvedCount');
        const attemptedCountEl = document.getElementById('attemptedCount');

        if (totalCountEl) totalCountEl.textContent = total;
        if (solvedCountEl) solvedCountEl.textContent = stats.solved;
        if (attemptedCountEl) attemptedCountEl.textContent = stats.attempted;
    }

    setupModal() {
        const modal = document.getElementById('questionModal');
        if (!modal) return;

        const closeBtn = modal.querySelector('.close');
        
        // Close modal on X click
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Open modal on question click
        document.addEventListener('click', (e) => {
            const questionItem = e.target.closest('.question-item');
            if (questionItem && !e.target.closest('.action-btn')) {
                const questionId = questionItem.dataset.id;
                this.showQuestionDetail(questionId);
            }
        });
    }

    showQuestionDetail(questionId) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) return;

        const modal = document.getElementById('questionModal');
        const modalContent = document.getElementById('modalContent');

        const status = progressTracker.getQuestionStatus(this.category, question.id);

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${question.title}</h2>
                <div class="modal-meta">
                    <span class="difficulty-badge difficulty-${question.difficulty}">${question.difficulty}</span>
                    <span class="category-badge">${question.category}</span>
                    <span class="category-badge ${status.status}">${this.getStatusIcon(status.status)}</span>
                </div>
            </div>

            <div class="modal-section">
                <h3>📋 Description</h3>
                <p>${question.description}</p>
            </div>

            <div class="modal-section">
                <h3>💡 Hints</h3>
                <ul>
                    ${question.hints.map(hint => `<li>${hint}</li>`).join('')}
                </ul>
            </div>

            <div class="modal-section">
                <h3>⏱️ Complexity</h3>
                <p><strong>Time:</strong> ${question.timeComplexity}</p>
                <p><strong>Space:</strong> ${question.spaceComplexity}</p>
            </div>

            <div class="modal-section">
                <h3>🔗 Practice Links</h3>
                <div class="practice-links">
                    ${question.practiceLinks.leetcode ? `<a href="${question.practiceLinks.leetcode}" target="_blank" class="practice-link">LeetCode</a>` : ''}
                    ${question.practiceLinks.gfg ? `<a href="${question.practiceLinks.gfg}" target="_blank" class="practice-link">GeeksforGeeks</a>` : ''}
                    ${question.practiceLinks.hackerrank ? `<a href="${question.practiceLinks.hackerrank}" target="_blank" class="practice-link">HackerRank</a>` : ''}
                    ${question.practiceLinks.codechef ? `<a href="${question.practiceLinks.codechef}" target="_blank" class="practice-link">CodeChef</a>` : ''}
                </div>
            </div>

            <div class="modal-section">
                <h3>🏢 Companies</h3>
                <div class="companies">
                    ${question.companies.map(company => `<span class="company-tag">${company}</span>`).join('')}
                </div>
            </div>

            <div class="modal-section">
                <h3>🏷️ Tags</h3>
                <div class="question-tags">
                    ${question.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    showError() {
        const container = document.getElementById('questionsContainer');
        if (container) {
            container.innerHTML = '<div class="no-results">Error loading questions. Please refresh the page.</div>';
        }
    }
}

// Global Functions for Button Actions
function toggleBookmark(questionId, event) {
    event.stopPropagation();
    const bookmarked = progressTracker.toggleBookmark(CATEGORY, questionId);
    const btn = event.target.closest('.bookmark-btn');
    btn.textContent = bookmarked ? '⭐' : '🔖';
    btn.classList.toggle('active', bookmarked);
}

function cycleStatus(questionId, event) {
    event.stopPropagation();
    const currentStatus = progressTracker.getQuestionStatus(CATEGORY, questionId).status;
    const statusCycle = { 'unsolved': 'attempted', 'attempted': 'solved', 'solved': 'unsolved' };
    const newStatus = statusCycle[currentStatus];
    
    progressTracker.setQuestionStatus(CATEGORY, questionId, newStatus);
    
    const btn = event.target.closest('.status-btn');
    btn.className = `action-btn status-btn ${newStatus}`;
    
    const icons = { 'unsolved': '⭕ Unsolved', 'attempted': '⏱️ Attempted', 'solved': '✅ Solved' };
    btn.textContent = icons[newStatus];
    
    // Update stats
    if (window.questionManager) {
        window.questionManager.updateStats();
    }
}

// Global function to load questions (called from category pages)
function loadQuestions(dataFile, category) {
    window.questionManager = new QuestionManager(category, dataFile);
}

// Initialize theme manager on all pages
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});
