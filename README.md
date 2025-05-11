This application has been entierly written by Amazon Q CLI, except this line. In the `promts.txt` file you can fin the prompts used.

# 3-Column Notes Application

A modern notes application with a 3-column layout for organizing and writing notes.

## Features

- **3-Column Layout**:
  - Column 1: Folders list
  - Column 2: Notes within the selected folder
  - Column 3: Note editor with free-form text

- **Folder Management**:
  - Create new folders
  - Select folders to view their notes

- **Note Management**:
  - Create new notes within folders
  - Edit existing notes
  - Delete notes
  - Auto-save notes

## How to Use

1. Open `index.html` in your web browser
2. Create a folder by clicking the folder icon in the first column
3. Select a folder to work with
4. Create a new note by clicking the document icon in the second column
5. Write your note in the editor in the third column
6. Save your note by clicking the save icon

## Technical Details

- Data is stored in your browser's local storage
- No server-side processing required
- Responsive design works on desktop (optimized for larger screens)

## Data Structure

The application uses a hierarchical data structure:
- Folders contain notes
- Each note has a title and content

## Future Enhancements

- Search functionality
- Markdown support
- Tags and categories
- Export/import functionality
- Drag and drop organization
