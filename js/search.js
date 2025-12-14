// Search and Filter Functionality

class SearchFilter {
    constructor() {
        this.allQuestions = [];
        this.filteredQuestions = [];
        this.currentFilters = {
            search: '',
            difficulty: '',
            category: '',
            bookmarked: false
        };
    }

    setQuestions(questions) {
        this.allQuestions = questions;
        this.filteredQuestions = questions;
    }

    applyFilters() {
        this.filteredQuestions = this.allQuestions.filter(q => {
            // Search filter
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                const matchesSearch = 
                    q.title.toLowerCase().includes(search) ||
                    q.description.toLowerCase().includes(search) ||
                    q.tags.some(tag => tag.toLowerCase().includes(search)) ||
                    q.companies.some(company => company.toLowerCase().includes(search)) ||
                    q.category.toLowerCase().includes(search);
                
                if (!matchesSearch) return false;
            }

            // Difficulty filter
            if (this.currentFilters.difficulty && q.difficulty !== this.currentFilters.difficulty) {
                return false;
            }

            // Category filter
            if (this.currentFilters.category && q.category !== this.currentFilters.category) {
                return false;
            }

            // Bookmarked filter
            if (this.currentFilters.bookmarked && 
                typeof CATEGORY !== 'undefined' && 
                !progressTracker.isBookmarked(CATEGORY, q.id)) {
                return false;
            }

            return true;
        });

        return this.filteredQuestions;
    }

    updateFilter(filterType, value) {
        this.currentFilters[filterType] = value;
        return this.applyFilters();
    }

    resetFilters() {
        this.currentFilters = {
            search: '',
            difficulty: '',
            category: '',
            bookmarked: false
        };
        return this.applyFilters();
    }

    sortQuestions(sortBy = 'id') {
        switch(sortBy) {
            case 'difficulty':
                const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                this.filteredQuestions.sort((a, b) => 
                    difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
                );
                break;
            case 'title':
                this.filteredQuestions.sort((a, b) => 
                    a.title.localeCompare(b.title)
                );
                break;
            case 'category':
                this.filteredQuestions.sort((a, b) => 
                    a.category.localeCompare(b.category)
                );
                break;
            default:
                // Keep original order
                break;
        }
        return this.filteredQuestions;
    }
}

// Global search function for index page
async function performGlobalSearch(searchTerm, difficulty = '', category = '') {
    const searchResults = document.getElementById('searchResults');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    
    if (!searchTerm.trim() && !difficulty && !category) {
        searchResults.style.display = 'none';
        return;
    }

    searchResults.style.display = 'block';
    searchResultsContainer.innerHTML = '<div class="loading">Searching...</div>';

    try {
        // Load all question files
        const [cQuestions, dsaQuestions, lldQuestions, docsQuestions] = await Promise.all([
            fetch('data/c-questions.json').then(r => r.json()),
            fetch('data/dsa-questions.json').then(r => r.json()),
            fetch('data/lld-questions.json').then(r => r.json()),
            fetch('data/zoho-docs.json').then(r => r.json())
        ]);

        // Combine and tag with source
        const allQuestions = [
            ...cQuestions.map(q => ({ ...q, source: 'c-programming', sourceName: 'C Programming' })),
            ...dsaQuestions.map(q => ({ ...q, source: 'zoho-dsa', sourceName: 'Zoho DSA' })),
            ...lldQuestions.map(q => ({ ...q, source: 'lld', sourceName: 'Low Level Design' })),
            ...docsQuestions.map(q => ({ ...q, source: 'zoho-docs', sourceName: 'Zoho-Docs Questions' }))
        ];

        // Filter questions
        const results = allQuestions.filter(q => {
            const search = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                q.title.toLowerCase().includes(search) ||
                q.description.toLowerCase().includes(search) ||
                q.tags.some(tag => tag.toLowerCase().includes(search)) ||
                q.companies.some(company => company.toLowerCase().includes(search));

            const matchesDifficulty = !difficulty || q.difficulty === difficulty;
            const matchesCategory = !category || q.category === category;

            return matchesSearch && matchesDifficulty && matchesCategory;
        });

        // Display results
        if (results.length === 0) {
            searchResultsContainer.innerHTML = '<div class="no-results">No questions found matching your criteria.</div>';
        } else {
            searchResultsContainer.innerHTML = results.map(q => `
                <div class="question-item">
                    <div class="question-header">
                        <div class="question-title-section">
                            <h3 class="question-title">${q.title}</h3>
                            <div class="question-meta">
                                <span class="difficulty-badge difficulty-${q.difficulty}">${q.difficulty}</span>
                                <span class="category-badge">${q.category}</span>
                                <span class="category-badge">${q.sourceName}</span>
                            </div>
                        </div>
                    </div>
                    <p class="question-description">${q.description}</p>
                    <div class="question-tags">
                        ${q.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div style="margin-top: 1rem;">
                        <a href="pages/${q.source}.html" class="card-btn">View in ${q.sourceName}</a>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResultsContainer.innerHTML = '<div class="no-results">Error loading search results. Please try again.</div>';
    }
}

// Initialize global search on index page
if (document.getElementById('globalSearch')) {
    const globalSearch = document.getElementById('globalSearch');
    const searchBtn = document.getElementById('searchBtn');
    const difficultyFilter = document.getElementById('difficultyFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    // Populate category filter with all categories
    const allCategories = new Set([
        'Arrays', 'Strings', 'Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs',
        'Dynamic Programming', 'Mathematical Problems', 'Greedy Algorithms', 'Backtracking',
        'Arrays & Strings', 'Functions', 'Pointers', 'Structures & Unions', 'File Handling',
        'Advanced Topics', 'Basic Concepts', 'Control Structures',
        'System Design', 'Game Design', 'Matrix', 'Patterns', 'Design'
    ]);

    allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    const doSearch = () => {
        performGlobalSearch(
            globalSearch.value,
            difficultyFilter.value,
            categoryFilter.value
        );
    };

    searchBtn.addEventListener('click', doSearch);
    globalSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSearch();
    });
    difficultyFilter.addEventListener('change', doSearch);
    categoryFilter.addEventListener('change', doSearch);
}
