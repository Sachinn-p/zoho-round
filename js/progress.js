// Progress Tracking with Local Storage

class ProgressTracker {
    constructor() {
        this.storageKey = 'zoho-practice-progress';
        this.progress = this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : {
            'c-programming': {},
            'zoho-dsa': {},
            'lld': {},
            'zoho-docs': {},
            'logical-coding': {}
        };
    }

    saveProgress() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    }

    getQuestionStatus(category, questionId) {
        return this.progress[category]?.[questionId] || { status: 'unsolved', bookmarked: false };
    }

    setQuestionStatus(category, questionId, status) {
        if (!this.progress[category]) {
            this.progress[category] = {};
        }
        if (!this.progress[category][questionId]) {
            this.progress[category][questionId] = { status: 'unsolved', bookmarked: false };
        }
        this.progress[category][questionId].status = status;
        this.saveProgress();
        this.updateCategoryProgress(category);
    }

    toggleBookmark(category, questionId) {
        if (!this.progress[category]) {
            this.progress[category] = {};
        }
        if (!this.progress[category][questionId]) {
            this.progress[category][questionId] = { status: 'unsolved', bookmarked: false };
        }
        this.progress[category][questionId].bookmarked = !this.progress[category][questionId].bookmarked;
        this.saveProgress();
        return this.progress[category][questionId].bookmarked;
    }

    isBookmarked(category, questionId) {
        return this.progress[category]?.[questionId]?.bookmarked || false;
    }

    getCategoryStats(category, totalQuestions) {
        const questions = this.progress[category] || {};
        let solved = 0;
        let attempted = 0;

        Object.values(questions).forEach(q => {
            if (q.status === 'solved') solved++;
            else if (q.status === 'attempted') attempted++;
        });

        return { solved, attempted, total: totalQuestions };
    }

    updateCategoryProgress(category) {
        // Update progress bars on main page
        const progressFills = document.querySelectorAll(`[data-progress="${category}"]`);
        const categoryTotals = {
            'c-programming': 22,
            'zoho-dsa': 50,
            'lld': 18,
            'zoho-docs': 106,
            'logical-coding': 97
        };

        const stats = this.getCategoryStats(category, categoryTotals[category]);
        const percentage = (stats.solved / stats.total) * 100;

        progressFills.forEach(fill => {
            fill.style.width = `${percentage}%`;
        });

        // Update text
        const textMap = {
            'c-programming': 'cProgress',
            'zoho-dsa': 'dsaProgress',
            'lld': 'lldProgress',
            'zoho-docs': 'docsProgress',
            'logical-coding': 'logicalProgress'
        };

        const textElement = document.getElementById(textMap[category]);
        if (textElement) {
            textElement.textContent = `${stats.solved}/${stats.total} Completed`;
        }
    }

    getBookmarkedQuestions(category) {
        const questions = this.progress[category] || {};
        return Object.keys(questions).filter(id => questions[id].bookmarked);
    }

    exportProgress() {
        const data = JSON.stringify(this.progress, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'zoho-practice-progress.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importProgress(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            this.progress = imported;
            this.saveProgress();
            location.reload();
        } catch (error) {
            console.error('Failed to import progress:', error);
            alert('Failed to import progress. Please check the file format.');
        }
    }

    clearProgress(category = null) {
        if (category) {
            this.progress[category] = {};
        } else {
            this.progress = {
                'c-programming': {},
                'zoho-dsa': {},
                'lld': {},
                'zoho-docs': {},
                'logical-coding': {}
            };
        }
        this.saveProgress();
        location.reload();
    }
}

// Initialize global progress tracker
const progressTracker = new ProgressTracker();

// Update all category progress on page load
if (document.querySelector('.categories')) {
    ['c-programming', 'zoho-dsa', 'lld', 'zoho-docs', 'logical-coding'].forEach(category => {
        progressTracker.updateCategoryProgress(category);
    });
}

// Helper functions for question pages
function isQuestionCompleted(category, questionId) {
    const status = progressTracker.getQuestionStatus(category, questionId);
    return status.status === 'solved';
}

function isQuestionBookmarked(category, questionId) {
    return progressTracker.isBookmarked(category, questionId);
}

function toggleQuestionComplete(category, questionId) {
    const status = progressTracker.getQuestionStatus(category, questionId);
    const newStatus = status.status === 'solved' ? 'unsolved' : 'solved';
    progressTracker.setQuestionStatus(category, questionId, newStatus);
}

function toggleQuestionBookmark(category, questionId) {
    return progressTracker.toggleBookmark(category, questionId);
}
