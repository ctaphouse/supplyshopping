// Supply Shopping List PWA
// Version 2.0

// ==================== State Management ====================

const DEFAULT_DATA = {
    version: '2.0',
    categories: [],
    lastModified: new Date().toISOString()
};

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
];

let appData = loadData();
let currentTab = 'shopping';
let searchQuery = '';

// ==================== Data Persistence ====================

function loadData() {
    try {
        const stored = localStorage.getItem('supplyListData');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading data:', e);
    }
    return { ...DEFAULT_DATA };
}

function saveData() {
    try {
        appData.lastModified = new Date().toISOString();
        localStorage.setItem('supplyListData', JSON.stringify(appData));
    } catch (e) {
        console.error('Error saving data:', e);
        showToast('Error saving data', 'error');
    }
}

// ==================== Utility Functions ====================

function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(isoString) {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== Toast Notifications ====================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}

// ==================== Modal Management ====================

function showModal(content) {
    const container = document.getElementById('modal-container');
    const modalContent = container.querySelector('.modal-content');
    modalContent.innerHTML = content;
    container.classList.remove('hidden');

    // Close on overlay click
    container.querySelector('.modal-overlay').onclick = closeModal;

    // Focus first input
    setTimeout(() => {
        const firstInput = modalContent.querySelector('input, textarea');
        if (firstInput) firstInput.focus();
    }, 100);
}

function closeModal() {
    const container = document.getElementById('modal-container');
    container.classList.add('hidden');
}

// ==================== Navigation ====================

function switchTab(tab) {
    currentTab = tab;
    searchQuery = '';

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });

    // Update header
    const headerTitle = document.getElementById('header-title');
    const headerAction = document.getElementById('header-action');

    const titles = {
        shopping: 'Shopping List',
        items: 'All Items',
        categories: 'Categories',
        settings: 'Settings'
    };

    headerTitle.textContent = titles[tab];
    headerAction.classList.toggle('hidden', tab === 'settings');

    // Render content
    renderCurrentTab();
}

// ==================== Rendering ====================

function renderCurrentTab() {
    const main = document.getElementById('main-content');

    switch (currentTab) {
        case 'shopping':
            renderShoppingList(main);
            break;
        case 'items':
            renderAllItems(main);
            break;
        case 'categories':
            renderCategories(main);
            break;
        case 'settings':
            renderSettings(main);
            break;
    }
}

// ==================== Shopping List View ====================

function renderShoppingList(container) {
    const shoppingItems = [];

    appData.categories.forEach(category => {
        category.items.forEach(item => {
            if (item.isOnShoppingList) {
                shoppingItems.push({ ...item, category });
            }
        });
    });

    if (shoppingItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <h3>Your shopping list is empty</h3>
                <p>Add items from the "All Items" tab or create new items to get started.</p>
            </div>
        `;
        return;
    }

    // Group by category
    const grouped = {};
    shoppingItems.forEach(item => {
        const catId = item.category.id;
        if (!grouped[catId]) {
            grouped[catId] = {
                category: item.category,
                items: []
            };
        }
        grouped[catId].items.push(item);
    });

    // Sort categories by sortOrder
    const sortedCategories = Object.values(grouped).sort((a, b) =>
        (a.category.sortOrder || 0) - (b.category.sortOrder || 0)
    );

    let html = `
        <button class="clear-list-btn" onclick="clearShoppingList()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Clear Shopping List
        </button>
    `;

    sortedCategories.forEach(group => {
        const checkedCount = group.items.filter(i => i.checked).length;
        html += `
            <div class="card" style="margin-bottom: 16px;">
                <div class="card-header">
                    <div class="card-title">
                        <span class="color-dot" style="background: ${group.category.color}"></span>
                        ${escapeHtml(group.category.name)}
                    </div>
                    <span class="card-badge">${checkedCount}/${group.items.length}</span>
                </div>
                ${group.items.map(item => `
                    <div class="list-item" onclick="toggleShoppingItemChecked('${item.id}')">
                        <div class="list-item-checkbox ${item.checked ? 'checked' : ''}">
                            ${item.checked ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                        </div>
                        <div class="list-item-content">
                            <div class="list-item-name ${item.checked ? 'checked' : ''}">${escapeHtml(item.name)}</div>
                            ${item.notes ? `<div class="list-item-notes">${escapeHtml(item.notes)}</div>` : ''}
                        </div>
                        <button class="list-item-action" onclick="event.stopPropagation(); removeFromShoppingList('${item.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    });

    container.innerHTML = html;
}

function toggleShoppingItemChecked(itemId) {
    appData.categories.forEach(category => {
        category.items.forEach(item => {
            if (item.id === itemId) {
                item.checked = !item.checked;
            }
        });
    });
    saveData();
    renderCurrentTab();
}

function removeFromShoppingList(itemId) {
    appData.categories.forEach(category => {
        category.items.forEach(item => {
            if (item.id === itemId) {
                item.isOnShoppingList = false;
                item.checked = false;
            }
        });
    });
    saveData();
    renderCurrentTab();
    showToast('Item removed from shopping list');
}

function clearShoppingList() {
    showModal(`
        <div class="modal-header">
            <h2 class="modal-title">Clear Shopping List</h2>
            <button class="modal-close" onclick="closeModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <p>Are you sure you want to remove all items from your shopping list? The items will still be available in your categories.</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-danger" onclick="confirmClearShoppingList()">Clear List</button>
        </div>
    `);
}

function confirmClearShoppingList() {
    appData.categories.forEach(category => {
        category.items.forEach(item => {
            item.isOnShoppingList = false;
            item.checked = false;
        });
    });
    saveData();
    closeModal();
    renderCurrentTab();
    showToast('Shopping list cleared', 'success');
}

// ==================== All Items View ====================

function renderAllItems(container) {
    let html = `
        <div class="search-container">
            <input type="text" class="search-input" placeholder="Search items..." value="${escapeHtml(searchQuery)}" oninput="handleSearch(this.value)">
        </div>
    `;

    const sortedCategories = [...appData.categories].sort((a, b) =>
        (a.sortOrder || 0) - (b.sortOrder || 0)
    );

    if (sortedCategories.length === 0) {
        html += `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                <h3>No items yet</h3>
                <p>Create a category first, then add items to it.</p>
            </div>
        `;
        container.innerHTML = html;
        return;
    }

    sortedCategories.forEach(category => {
        let items = category.items || [];

        // Filter by search
        if (searchQuery) {
            items = items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Sort items alphabetically
        items = [...items].sort((a, b) => a.name.localeCompare(b.name));

        if (searchQuery && items.length === 0) return;

        const onListCount = items.filter(i => i.isOnShoppingList).length;

        html += `
            <div class="card" style="margin-bottom: 16px;">
                <div class="card-header">
                    <div class="card-title">
                        <span class="color-dot" style="background: ${category.color}"></span>
                        ${escapeHtml(category.name)}
                    </div>
                    <span class="card-badge">${onListCount} on list</span>
                </div>
                ${items.length === 0 ? `
                    <div class="list-item">
                        <div class="list-item-content">
                            <div class="list-item-notes">No items in this category</div>
                        </div>
                    </div>
                ` : items.map(item => `
                    <div class="list-item" onclick="toggleItemOnShoppingList('${item.id}')">
                        ${item.isOnShoppingList ? '<div class="on-list-indicator"></div>' : ''}
                        <div class="list-item-content">
                            <div class="list-item-name">${escapeHtml(item.name)}</div>
                            ${item.notes ? `<div class="list-item-notes">${escapeHtml(item.notes)}</div>` : ''}
                        </div>
                        <button class="list-item-action" onclick="event.stopPropagation(); showEditItemModal('${item.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    });

    container.innerHTML = html;
}

function handleSearch(query) {
    searchQuery = query;
    renderCurrentTab();
}

function toggleItemOnShoppingList(itemId) {
    appData.categories.forEach(category => {
        category.items.forEach(item => {
            if (item.id === itemId) {
                item.isOnShoppingList = !item.isOnShoppingList;
                if (!item.isOnShoppingList) {
                    item.checked = false;
                }
            }
        });
    });
    saveData();
    renderCurrentTab();
}

// ==================== Categories View ====================

function renderCategories(container) {
    if (appData.categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <h3>No categories yet</h3>
                <p>Create your first category to start organizing your supplies.</p>
            </div>
        `;
        return;
    }

    const sortedCategories = [...appData.categories].sort((a, b) =>
        (a.sortOrder || 0) - (b.sortOrder || 0)
    );

    let html = '<div class="card">';

    sortedCategories.forEach(category => {
        const itemCount = category.items ? category.items.length : 0;
        html += `
            <div class="category-item" onclick="showEditCategoryModal('${category.id}')">
                <div class="category-color" style="background: ${category.color}"></div>
                <div class="category-info">
                    <div class="category-name">${escapeHtml(category.name)}</div>
                    <div class="category-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted)">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ==================== Settings View ====================

function renderSettings(container) {
    const totalCategories = appData.categories.length;
    const totalItems = appData.categories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
    const shoppingItems = appData.categories.reduce((sum, cat) =>
        sum + (cat.items?.filter(i => i.isOnShoppingList).length || 0), 0);

    container.innerHTML = `
        <div class="settings-section">
            <h3 class="settings-title">Data Summary</h3>
            <div class="settings-item">
                <span class="settings-item-label">Categories</span>
                <span class="settings-item-value">${totalCategories}</span>
            </div>
            <div class="settings-item">
                <span class="settings-item-label">Total Items</span>
                <span class="settings-item-value">${totalItems}</span>
            </div>
            <div class="settings-item">
                <span class="settings-item-label">Items on Shopping List</span>
                <span class="settings-item-value">${shoppingItems}</span>
            </div>
            <div class="settings-item">
                <span class="settings-item-label">Last Modified</span>
                <span class="settings-item-value">${formatDate(appData.lastModified)}</span>
            </div>
        </div>

        <div class="settings-section">
            <h3 class="settings-title">Data Management</h3>
            <button class="settings-btn" onclick="exportData()">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Export Data</span>
            </button>
            <button class="settings-btn" onclick="showImportModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>Import Data</span>
            </button>
            <button class="settings-btn danger" onclick="showResetModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                <span>Reset All Data</span>
            </button>
        </div>

        <div class="settings-section">
            <h3 class="settings-title">About</h3>
            <div class="settings-item">
                <span class="settings-item-label">Version</span>
                <span class="settings-item-value">2.0</span>
            </div>
        </div>
    `;
}

// ==================== Import/Export ====================

function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-list-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Data exported successfully', 'success');
}

function showImportModal() {
    showModal(`
        <div class="modal-header">
            <h2 class="modal-title">Import Data</h2>
            <button class="modal-close" onclick="closeModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <p style="margin-bottom: 16px; color: var(--text-secondary);">Select a JSON file to import. This will replace all current data.</p>
            <input type="file" id="import-file" accept=".json" class="form-input" onchange="handleFileImport(this.files[0])">
        </div>
    `);
}

function handleFileImport(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            // Validate data structure
            if (!importedData.categories || !Array.isArray(importedData.categories)) {
                throw new Error('Invalid data format');
            }

            appData = importedData;
            appData.lastModified = new Date().toISOString();
            saveData();
            closeModal();
            renderCurrentTab();
            showToast('Data imported successfully', 'success');
        } catch (err) {
            showToast('Error importing data: Invalid format', 'error');
        }
    };
    reader.readAsText(file);
}

function showResetModal() {
    showModal(`
        <div class="modal-header">
            <h2 class="modal-title">Reset All Data</h2>
            <button class="modal-close" onclick="closeModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <p style="color: var(--danger);">Warning: This will permanently delete all your categories and items. This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-danger" onclick="confirmReset()">Reset Everything</button>
        </div>
    `);
}

function confirmReset() {
    appData = { ...DEFAULT_DATA };
    saveData();
    closeModal();
    renderCurrentTab();
    showToast('All data has been reset', 'success');
}

// ==================== Add Item Modal ====================

function showAddItemModal() {
    if (appData.categories.length === 0) {
        showToast('Create a category first', 'warning');
        return;
    }

    const categoryOptions = appData.categories
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`)
        .join('');

    showModal(`
        <div class="modal-header">
            <h2 class="modal-title">Add Item</h2>
            <button class="modal-close" onclick="closeModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">Item Name</label>
                <input type="text" id="item-name" class="form-input" placeholder="Enter item name">
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <select id="item-category" class="form-input">
                    ${categoryOptions}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Notes (optional)</label>
                <textarea id="item-notes" class="form-input" placeholder="Add notes..."></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveNewItem()">Add Item</button>
        </div>
    `);
}

function saveNewItem() {
    const name = document.getElementById('item-name').value.trim();
    const categoryId = document.getElementById('item-category').value;
    const notes = document.getElementById('item-notes').value.trim();

    if (!name) {
        showToast('Please enter an item name', 'error');
        return;
    }

    const category = appData.categories.find(c => c.id === categoryId);
    if (!category) {
        showToast('Category not found', 'error');
        return;
    }

    if (!category.items) {
        category.items = [];
    }

    category.items.push({
        id: generateId(),
        name,
        notes,
        isOnShoppingList: false,
        checked: false
    });

    saveData();
    closeModal();
    renderCurrentTab();
    showToast('Item added successfully', 'success');
}

// ==================== Edit Item Modal ====================

function showEditItemModal(itemId) {
    let targetItem = null;
    let targetCategory = null;

    appData.categories.forEach(category => {
        category.items?.forEach(item => {
            if (item.id === itemId) {
                targetItem = item;
                targetCategory = category;
            }
        });
    });

    if (!targetItem) {
        showToast('Item not found', 'error');
        return;
    }

    const categoryOptions = appData.categories
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(cat => `<option value="${cat.id}" ${cat.id === targetCategory.id ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`)
        .join('');

    showModal(`
        <div class="modal-header">
            <h2 class="modal-title">Edit Item</h2>
            <button class="modal-close" onclick="closeModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">Item Name</label>
                <input type="text" id="edit-item-name" class="form-input" value="${escapeHtml(targetItem.name)}">
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <select id="edit-item-category" class="form-input">
                    ${categoryOptions}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Notes (optional)</label>
                <textarea id="edit-item-notes" class="form-input">${escapeHtml(targetItem.notes || '')}</textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-danger" onclick="deleteItem('${itemId}')" style="margin-right: auto;">Delete</button>
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="updateItem('${itemId}', '${targetCategory.id}')">Save</button>
        </div>
    `);
}

function updateItem(itemId, originalCategoryId) {
    const name = document.getElementById('edit-item-name').value.trim();
    const newCategoryId = document.getElementById('edit-item-category').value;
    const notes = document.getElementById('edit-item-notes').value.trim();

    if (!name) {
        showToast('Please enter an item name', 'error');
        return;
    }

    // Find and update the item
    let itemToMove = null;

    appData.categories.forEach(category => {
        if (category.id === originalCategoryId) {
            const itemIndex = category.items?.findIndex(i => i.id === itemId);
            if (itemIndex !== -1) {
                if (newCategoryId === originalCategoryId) {
                    // Same category, just update
                    category.items[itemIndex].name = name;
                    category.items[itemIndex].notes = notes;
                } else {
                    // Moving to different category
                    itemToMove = { ...category.items[itemIndex], name, notes };
                    category.items.splice(itemIndex, 1);
                }
            }
        }
    });

    // If moving to different category
    if (itemToMove) {
        const newCategory = appData.categories.find(c => c.id === newCategoryId);
        if (newCategory) {
            if (!newCategory.items) newCategory.items = [];
            newCategory.items.push(itemToMove);
        }
    }

    saveData();
    closeModal();
    renderCurrentTab();
    showToast('Item updated successfully', 'success');
}

function deleteItem(itemId) {
    showModal(`
        <div class="modal-header">
            <h2 class="modal-title">Delete Item</h2>
            <button class="modal-close" onclick="closeModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-danger" onclick="confirmDeleteItem('${itemId}')">Delete</button>
        </div>
    `);
}

function confirmDeleteItem(itemId) {
    appData.categories.forEach(category => {
        if (category.items) {
            category.items = category.items.filter(item => item.id !== itemId);
        }
    });

    saveData();
    closeModal();
    renderCurrentTab();
    showToast('Item deleted', 'success');
}

// ==================== Add Category Modal ====================

function showAddCategoryModal() {
    const colorOptions = COLORS.map((color, index) => `
        <button type="button" class="color-option ${index === 0 ? 'selected' : ''}"
                style="background: ${color}"
                data-color="${color}"
                onclick="selectColor(this)">
        </button>
    `).join('');

    showModal(`
        <div class="modal-header">
            <h2 class="modal-title">Add Category</h2>
            <button class="modal-close" onclick="closeModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">Category Name</label>
                <input type="text" id="category-name" class="form-input" placeholder="Enter category name">
            </div>
            <div class="form-group">
                <label class="form-label">Color</label>
                <div class="color-picker">
                    ${colorOptions}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Sort Order</label>
                <input type="number" id="category-sort" class="form-input" value="${appData.categories.length + 1}" min="1">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveNewCategory()">Add Category</button>
        </div>
    `);
}

function selectColor(element) {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
}

function saveNewCategory() {
    const name = document.getElementById('category-name').value.trim();
    const selectedColor = document.querySelector('.color-option.selected');
    const color = selectedColor ? selectedColor.dataset.color : COLORS[0];
    const sortOrder = parseInt(document.getElementById('category-sort').value) || 1;

    if (!name) {
        showToast('Please enter a category name', 'error');
        return;
    }

    appData.categories.push({
        id: generateId(),
        name,
        color,
        sortOrder,
        items: []
    });

    saveData();
    closeModal();
    renderCurrentTab();
    showToast('Category added successfully', 'success');
}

// ==================== Edit Category Modal ====================

function showEditCategoryModal(categoryId) {
    const category = appData.categories.find(c => c.id === categoryId);
    if (!category) {
        showToast('Category not found', 'error');
        return;
    }

    const colorOptions = COLORS.map(color => `
        <button type="button" class="color-option ${color === category.color ? 'selected' : ''}"
                style="background: ${color}"
                data-color="${color}"
                onclick="selectColor(this)">
        </button>
    `).join('');

    showModal(`
        <div class="modal-header">
            <h2 class="modal-title">Edit Category</h2>
            <button class="modal-close" onclick="closeModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">Category Name</label>
                <input type="text" id="edit-category-name" class="form-input" value="${escapeHtml(category.name)}">
            </div>
            <div class="form-group">
                <label class="form-label">Color</label>
                <div class="color-picker">
                    ${colorOptions}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Sort Order</label>
                <input type="number" id="edit-category-sort" class="form-input" value="${category.sortOrder || 1}" min="1">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-danger" onclick="deleteCategory('${categoryId}')" style="margin-right: auto;">Delete</button>
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="updateCategory('${categoryId}')">Save</button>
        </div>
    `);
}

function updateCategory(categoryId) {
    const name = document.getElementById('edit-category-name').value.trim();
    const selectedColor = document.querySelector('.color-option.selected');
    const color = selectedColor ? selectedColor.dataset.color : COLORS[0];
    const sortOrder = parseInt(document.getElementById('edit-category-sort').value) || 1;

    if (!name) {
        showToast('Please enter a category name', 'error');
        return;
    }

    const category = appData.categories.find(c => c.id === categoryId);
    if (category) {
        category.name = name;
        category.color = color;
        category.sortOrder = sortOrder;
    }

    saveData();
    closeModal();
    renderCurrentTab();
    showToast('Category updated successfully', 'success');
}

function deleteCategory(categoryId) {
    const category = appData.categories.find(c => c.id === categoryId);
    const itemCount = category?.items?.length || 0;

    showModal(`
        <div class="modal-header">
            <h2 class="modal-title">Delete Category</h2>
            <button class="modal-close" onclick="closeModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <p>Are you sure you want to delete "${escapeHtml(category?.name || 'this category')}"?</p>
            ${itemCount > 0 ? `<p style="color: var(--danger); margin-top: 8px;">This will also delete ${itemCount} item${itemCount !== 1 ? 's' : ''} in this category.</p>` : ''}
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-danger" onclick="confirmDeleteCategory('${categoryId}')">Delete</button>
        </div>
    `);
}

function confirmDeleteCategory(categoryId) {
    appData.categories = appData.categories.filter(c => c.id !== categoryId);
    saveData();
    closeModal();
    renderCurrentTab();
    showToast('Category deleted', 'success');
}

// ==================== Header Action Handler ====================

function handleHeaderAction() {
    switch (currentTab) {
        case 'shopping':
        case 'items':
            showAddItemModal();
            break;
        case 'categories':
            showAddCategoryModal();
            break;
    }
}

// ==================== Initialization ====================

function init() {
    // Set up navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });

    // Set up header action button
    document.getElementById('header-action').addEventListener('click', handleHeaderAction);

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    }

    // Render initial view
    renderCurrentTab();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
