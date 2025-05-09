// DOM Elements
const folderList = document.getElementById('folder-list');
const notesList = document.getElementById('notes-list');
const currentFolderName = document.getElementById('current-folder-name');
const noteContent = document.getElementById('note-content');
const markdownPreview = document.getElementById('markdown-preview');
const togglePreviewBtn = document.getElementById('toggle-preview-btn');
const newFolderBtn = document.getElementById('new-folder-btn');
const renameFolderBtn = document.getElementById('rename-folder-btn');
const deleteFolderBtn = document.getElementById('delete-folder-btn');
const newFolderForm = document.getElementById('new-folder-form');
const renameFolderForm = document.getElementById('rename-folder-form');
const newFolderInput = document.getElementById('new-folder-input');
const renameFolderInput = document.getElementById('rename-folder-input');
const saveFolderBtn = document.getElementById('save-folder-btn');
const saveRenameBtn = document.getElementById('save-rename-btn');
const cancelFolderBtn = document.getElementById('cancel-folder-btn');
const cancelRenameBtn = document.getElementById('cancel-rename-btn');
const newNoteBtn = document.getElementById('new-note-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

// App State
let folders = JSON.parse(localStorage.getItem('folders')) || [];
let currentFolderId = null;
let currentNoteId = null;
let isNewNote = false;
let autosaveTimer = null;
let lastSavedContent = '';
let isPreviewMode = false;

// Initialize App
function initApp() {
    // Configure marked.js options
    marked.setOptions({
        breaks: true,        // Add <br> on single line breaks
        gfm: true,           // Use GitHub Flavored Markdown
        headerIds: true,     // Add IDs to headers
        sanitize: false      // Allow HTML in markdown
    });
    
    renderFolders();
    
    // If we have folders, select the first one
    if (folders.length > 0) {
        selectFolder(folders[0].id);
    } else {
        // No folders, disable delete folder button
        deleteFolderBtn.disabled = true;
        renameFolderBtn.disabled = true;
    }
}

// Folder Functions
function renderFolders() {
    folderList.innerHTML = '';
    
    if (folders.length === 0) {
        folderList.innerHTML = '<p class="empty-message">No folders yet</p>';
        return;
    }
    
    folders.forEach(folder => {
        const folderElement = document.createElement('div');
        folderElement.classList.add('folder-item');
        if (folder.id === currentFolderId) {
            folderElement.classList.add('active');
        }
        
        folderElement.innerHTML = `
            <i class="fas fa-folder"></i>
            <span>${folder.name}</span>
        `;
        
        folderElement.addEventListener('click', () => selectFolder(folder.id));
        folderList.appendChild(folderElement);
    });
}

function selectFolder(folderId) {
    currentFolderId = folderId;
    currentNoteId = null;
    
    // Stop any existing autosave timer
    stopAutosaveTimer();
    
    // Update UI
    renderFolders();
    
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
        currentFolderName.textContent = folder.name;
        newNoteBtn.disabled = false;
        deleteFolderBtn.disabled = false;
        renameFolderBtn.disabled = false;
        renderNotes(folder.notes || []);
    }
    
    // Reset note editor
    noteContent.value = '';
    noteContent.disabled = true;
    saveNoteBtn.disabled = true;
    deleteNoteBtn.disabled = true;
    togglePreviewBtn.disabled = true;
    
    // Hide preview if it's active
    if (isPreviewMode) {
        togglePreview();
    }
}

function showNewFolderForm() {
    newFolderForm.classList.remove('hidden');
    newFolderInput.focus();
}

function hideNewFolderForm() {
    newFolderForm.classList.add('hidden');
    newFolderInput.value = '';
}

function createNewFolder() {
    const folderName = newFolderInput.value.trim();
    
    if (!folderName) {
        alert('Please enter a folder name');
        return;
    }
    
    const newFolder = {
        id: Date.now().toString(),
        name: folderName,
        notes: []
    };
    
    folders.push(newFolder);
    saveFolders();
    hideNewFolderForm();
    renderFolders();
    selectFolder(newFolder.id);
}

// Folder Rename Functions
function showRenameFolderForm() {
    if (!currentFolderId) return;
    
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    
    // Populate the input with current folder name
    renameFolderInput.value = folder.name;
    
    // Show the rename form
    renameFolderForm.classList.remove('hidden');
    renameFolderInput.focus();
    renameFolderInput.select(); // Select the text for easy editing
}

function hideRenameFolderForm() {
    renameFolderForm.classList.add('hidden');
    renameFolderInput.value = '';
}

function renameFolder() {
    if (!currentFolderId) return;
    
    const newName = renameFolderInput.value.trim();
    
    if (!newName) {
        alert('Please enter a folder name');
        return;
    }
    
    // Find the folder and update its name
    const folder = folders.find(f => f.id === currentFolderId);
    if (folder) {
        folder.name = newName;
        
        // Save to localStorage
        saveFolders();
        
        // Update UI
        currentFolderName.textContent = newName;
        renderFolders();
        
        // Show success notification
        showNotification('Folder renamed successfully!', 'success');
    }
    
    // Hide the rename form
    hideRenameFolderForm();
}

// Function to delete a folder and all its notes
function deleteFolder() {
    if (!currentFolderId) return;
    
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    
    // Confirm deletion with user
    if (!confirm(`Are you sure you want to delete the folder "${folder.name}" and all its notes?`)) {
        return;
    }
    
    // Stop any autosave timer
    stopAutosaveTimer();
    
    // Remove the folder from the array
    folders = folders.filter(f => f.id !== currentFolderId);
    
    // Save to localStorage
    saveFolders();
    
    // Reset current selections
    currentFolderId = null;
    currentNoteId = null;
    
    // Reset UI
    currentFolderName.textContent = 'Select a Folder';
    noteContent.value = '';
    noteContent.disabled = true;
    saveNoteBtn.disabled = true;
    deleteNoteBtn.disabled = true;
    togglePreviewBtn.disabled = true;
    newNoteBtn.disabled = true;
    deleteFolderBtn.disabled = true;
    renameFolderBtn.disabled = true;
    
    // Hide preview if it's active
    if (isPreviewMode) {
        togglePreview();
    }
    
    // Re-render folders
    renderFolders();
    
    // Clear notes list
    notesList.innerHTML = '<p class="empty-message">Select a folder to view notes</p>';
    
    // If we have other folders, select the first one
    if (folders.length > 0) {
        selectFolder(folders[0].id);
    }
}

function saveFolders() {
    localStorage.setItem('folders', JSON.stringify(folders));
}

// Note Functions
function renderNotes(notes) {
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
        notesList.innerHTML = '<p class="empty-message">No notes in this folder</p>';
        return;
    }
    
    // Sort notes by updatedAt field in descending order (newest first)
    const sortedNotes = [...notes].sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    
    sortedNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note-item');
        if (note.id === currentNoteId) {
            noteElement.classList.add('active');
        }
        
        const previewText = note.content.length > 50 
            ? note.content.substring(0, 50) + '...' 
            : note.content;
            
        noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <p>${previewText}</p>
        `;
        
        noteElement.addEventListener('click', () => selectNote(note.id));
        notesList.appendChild(noteElement);
    });
}

function selectNote(noteId) {
    currentNoteId = noteId;
    isNewNote = false;
    
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    
    const note = folder.notes.find(n => n.id === noteId);
    if (!note) return;
    
    // Update UI
    renderNotes(folder.notes);
    
    // Populate editor with title on first line and content below
    noteContent.value = `${note.title}\n\n${note.content}`;
    noteContent.disabled = false;
    saveNoteBtn.disabled = false;
    deleteNoteBtn.disabled = false;
    togglePreviewBtn.disabled = false;
    
    // Store the current content for autosave comparison
    lastSavedContent = noteContent.value;
    
    // Start autosave timer
    startAutosaveTimer();
    
    // Set preview mode as default when browsing notes
    if (!isPreviewMode) {
        togglePreview();
    } else {
        // If already in preview mode, update the preview content
        updateMarkdownPreview();
    }
}

function createNewNote() {
    isNewNote = true;
    currentNoteId = null;
    
    // Clear and enable editor
    noteContent.value = '';
    noteContent.disabled = false;
    saveNoteBtn.disabled = false;
    deleteNoteBtn.disabled = true;
    togglePreviewBtn.disabled = false;
    
    // If in preview mode, switch to edit mode
    if (isPreviewMode) {
        togglePreview();
    }
    
    // Focus content input
    noteContent.focus();
    
    // Update notes list UI
    const folder = folders.find(f => f.id === currentFolderId);
    if (folder) {
        renderNotes(folder.notes || []);
    }
    
    // Store the current content for autosave comparison
    lastSavedContent = noteContent.value;
    
    // Start autosave timer
    startAutosaveTimer();
}

function saveNote() {
    const contentText = noteContent.value.trim();
    
    if (!contentText) {
        alert('Please enter some content for your note');
        return;
    }
    
    // Extract title from first line and content from the rest
    const lines = contentText.split('\n');
    const title = lines[0].trim() || 'Untitled Note';
    const content = lines.slice(1).join('\n').trim();
    
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    
    if (isNewNote) {
        // Create new note
        const newNote = {
            id: Date.now().toString(),
            title: title,
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        folder.notes = folder.notes || [];
        // Add new note at the beginning of the array (top of the list)
        folder.notes.unshift(newNote);
        currentNoteId = newNote.id;
        isNewNote = false;
    } else {
        // Update existing note
        const note = folder.notes.find(n => n.id === currentNoteId);
        if (note) {
            note.title = title;
            note.content = content;
            note.updatedAt = new Date().toISOString();
        }
    }
    
    // Update the last saved content
    lastSavedContent = noteContent.value;
    
    saveFolders();
    renderNotes(folder.notes);
    deleteNoteBtn.disabled = false;
}

function deleteNote() {
    if (!currentNoteId || !currentFolderId) return;
    
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    // Stop autosave timer
    stopAutosaveTimer();
    
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    
    folder.notes = folder.notes.filter(note => note.id !== currentNoteId);
    saveFolders();
    
    // Reset editor
    noteContent.value = '';
    noteContent.disabled = true;
    saveNoteBtn.disabled = true;
    deleteNoteBtn.disabled = true;
    togglePreviewBtn.disabled = true;
    
    // Hide preview if it's active
    if (isPreviewMode) {
        togglePreview();
    }
    
    currentNoteId = null;
    renderNotes(folder.notes);
}

// Markdown Preview Functions
function togglePreview() {
    isPreviewMode = !isPreviewMode;
    
    if (isPreviewMode) {
        // Switch to preview mode
        noteContent.classList.add('hidden');
        markdownPreview.classList.remove('hidden');
        togglePreviewBtn.innerHTML = '<i class="fas fa-edit"></i>';
        togglePreviewBtn.title = "Edit Mode";
        
        // Update the preview content
        updateMarkdownPreview();
        
        // Add click event listener to the preview area to switch back to edit mode
        markdownPreview.addEventListener('click', switchToEditMode);
    } else {
        // Switch to edit mode
        markdownPreview.classList.add('hidden');
        noteContent.classList.remove('hidden');
        togglePreviewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        togglePreviewBtn.title = "Preview Mode";
        
        // Remove the click event listener
        markdownPreview.removeEventListener('click', switchToEditMode);
        
        // Focus the editor
        noteContent.focus();
    }
}

function switchToEditMode() {
    if (isPreviewMode) {
        togglePreview();
    }
}

function updateMarkdownPreview() {
    if (!isPreviewMode) return;
    
    const contentText = noteContent.value.trim();
    if (!contentText) {
        markdownPreview.innerHTML = '<p class="empty-message">No content to preview</p>';
        return;
    }
    
    // Extract title and content
    const lines = contentText.split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    
    // Convert markdown to HTML
    const titleHtml = `<h1>${title}</h1>`;
    const contentHtml = marked.parse(content);
    
    // Update the preview
    markdownPreview.innerHTML = titleHtml + contentHtml;
}

// Autosave Functions
function startAutosaveTimer() {
    // Clear any existing timer first
    stopAutosaveTimer();
    
    // Set a new timer that runs every 2 seconds
    autosaveTimer = setInterval(() => {
        // Only autosave if the content has changed
        if (noteContent.value !== lastSavedContent && !noteContent.disabled) {
            autosaveNote();
        }
    }, 2000); // 2000 milliseconds = 2 seconds
}

function stopAutosaveTimer() {
    if (autosaveTimer) {
        clearInterval(autosaveTimer);
        autosaveTimer = null;
    }
}

function autosaveNote() {
    const contentText = noteContent.value.trim();
    
    if (!contentText) return; // Don't save empty notes
    
    // Extract title from first line and content from the rest
    const lines = contentText.split('\n');
    const title = lines[0].trim() || 'Untitled Note';
    const content = lines.slice(1).join('\n').trim();
    
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    
    if (isNewNote) {
        // Create new note
        const newNote = {
            id: Date.now().toString(),
            title: title,
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        folder.notes = folder.notes || [];
        // Add new note at the beginning of the array (top of the list)
        folder.notes.unshift(newNote);
        currentNoteId = newNote.id;
        isNewNote = false;
        deleteNoteBtn.disabled = false;
    } else {
        // Update existing note
        const note = folder.notes.find(n => n.id === currentNoteId);
        if (note) {
            note.title = title;
            note.content = content;
            note.updatedAt = new Date().toISOString();
        }
    }
    
    // Update the last saved content
    lastSavedContent = noteContent.value;
    
    // Save to localStorage
    saveFolders();
    
    // Update the notes list to reflect any title changes
    renderNotes(folder.notes);
    
    // Update preview if it's active
    if (isPreviewMode) {
        updateMarkdownPreview();
    }
    
    // Show a subtle autosave indicator
    showAutosaveIndicator();
}

function showAutosaveIndicator() {
    // Create or update autosave indicator
    let indicator = document.getElementById('autosave-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'autosave-indicator';
        indicator.style.position = 'fixed';
        indicator.style.bottom = '10px';
        indicator.style.right = '10px';
        indicator.style.padding = '5px 10px';
        indicator.style.backgroundColor = 'rgba(52, 152, 219, 0.8)';
        indicator.style.color = 'white';
        indicator.style.borderRadius = '4px';
        indicator.style.fontSize = '12px';
        indicator.style.transition = 'opacity 0.5s';
        document.body.appendChild(indicator);
    }
    
    // Show the indicator with current time
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    indicator.textContent = `Autosaved at ${timeStr}`;
    indicator.style.opacity = '1';
    
    // Hide the indicator after 2 seconds
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

// Import/Export Functions
function exportNotes() {
    // Create a copy of the folders data
    const exportData = {
        folders: JSON.parse(JSON.stringify(folders)),
        exportDate: new Date().toISOString()
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create a blob with the data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    
    // Set filename with current date
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    downloadLink.download = `notes_backup_${dateStr}.json`;
    
    // Append to body, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Show success notification
    showNotification('Notes exported successfully!', 'success');
}

function importNotes() {
    // Trigger file input click
    importFile.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            // Validate the imported data
            if (!importData.folders || !Array.isArray(importData.folders)) {
                throw new Error('Invalid import file format');
            }
            
            // Ask for confirmation
            if (confirm('This will replace all your current notes. Are you sure you want to continue?')) {
                // Replace the current folders with imported ones
                folders = importData.folders;
                
                // Save to localStorage
                saveFolders();
                
                // Reset current selections
                currentFolderId = null;
                currentNoteId = null;
                
                // Reset UI
                noteContent.value = '';
                noteContent.disabled = true;
                saveNoteBtn.disabled = true;
                deleteNoteBtn.disabled = true;
                togglePreviewBtn.disabled = true;
                
                // Hide preview if it's active
                if (isPreviewMode) {
                    togglePreview();
                }
                
                // Re-render folders
                renderFolders();
                
                // If we have folders, select the first one
                if (folders.length > 0) {
                    selectFolder(folders[0].id);
                } else {
                    // No folders, disable delete folder button
                    deleteFolderBtn.disabled = true;
                    renameFolderBtn.disabled = true;
                    // Clear notes list
                    notesList.innerHTML = '<p class="empty-message">Select a folder to view notes</p>';
                }
                
                // Show success notification
                showNotification('Notes imported successfully!', 'success');
            }
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Error importing notes. Invalid file format.', 'error');
        }
        
        // Reset the file input
        importFile.value = '';
    };
    
    reader.onerror = function() {
        showNotification('Error reading the file', 'error');
        // Reset the file input
        importFile.value = '';
    };
    
    reader.readAsText(file);
}

function showNotification(message, type) {
    // Remove any existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        document.body.removeChild(existingNotification);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Hide and remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add event listener for note content changes
noteContent.addEventListener('input', () => {
    // If the timer isn't running, start it
    if (!autosaveTimer) {
        startAutosaveTimer();
    }
    
    // Update preview if it's active
    if (isPreviewMode) {
        updateMarkdownPreview();
    }
});

// Event Listeners
newFolderBtn.addEventListener('click', showNewFolderForm);
renameFolderBtn.addEventListener('click', showRenameFolderForm);
deleteFolderBtn.addEventListener('click', deleteFolder);
saveFolderBtn.addEventListener('click', createNewFolder);
saveRenameBtn.addEventListener('click', renameFolder);
cancelFolderBtn.addEventListener('click', hideNewFolderForm);
cancelRenameBtn.addEventListener('click', hideRenameFolderForm);
newNoteBtn.addEventListener('click', createNewNote);
saveNoteBtn.addEventListener('click', saveNote);
deleteNoteBtn.addEventListener('click', deleteNote);
togglePreviewBtn.addEventListener('click', togglePreview);
exportBtn.addEventListener('click', exportNotes);
importBtn.addEventListener('click', importNotes);
importFile.addEventListener('change', handleFileImport);

// Initialize the app
initApp();
