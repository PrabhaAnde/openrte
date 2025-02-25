import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

export class UndoRedoPlugin extends BasePlugin {
  private undoButton: HTMLElement;
  private redoButton: HTMLElement;
  
  constructor() {
    // We'll override the createToolbarControl method
    super('undoRedo', '', 'openrte-undo-redo-control');
    
    // Create temporary buttons (will be replaced in createToolbarControl)
    this.undoButton = document.createElement('button');
    this.redoButton = document.createElement('button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Add input listener to enable/disable buttons
    if (editor) {
      const contentArea = editor.getContentArea();
      contentArea.addEventListener('input', this.updateButtonStates);
      
      // Initialize button states
      this.updateButtonStates();
    }
  }
  
  execute(): void {
    // This is a container plugin, undo and redo have their own methods
  }
  
  createToolbarControl(): HTMLElement {
    // Create a container for undo/redo buttons
    const container = document.createElement('div');
    container.className = 'openrte-undo-redo-container';
    container.style.display = 'flex';
    
    // Create undo button
    this.undoButton = document.createElement('button');
    this.undoButton.className = 'openrte-button openrte-undo-button';
    this.undoButton.title = 'Undo (Ctrl+Z)';
    this.undoButton.innerHTML = '↩'; // Undo arrow
    this.undoButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.undo();
      if (this.editor) {
        this.editor.focus();
      }
    });
    
    // Create redo button
    this.redoButton = document.createElement('button');
    this.redoButton.className = 'openrte-button openrte-redo-button';
    this.redoButton.title = 'Redo (Ctrl+Y)';
    this.redoButton.innerHTML = '↪'; // Redo arrow
    this.redoButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.redo();
      if (this.editor) {
        this.editor.focus();
      }
    });
    
    // Add buttons to container
    container.appendChild(this.undoButton);
    container.appendChild(this.redoButton);
    
    // Initialize button states
    this.updateButtonStates();
    
    return container;
  }
  
  private undo(): void {
    if (!this.editor) return;
    
    document.execCommand('undo', false);
    
    // Update button states
    this.updateButtonStates();
  }
  
  private redo(): void {
    if (!this.editor) return;
    
    document.execCommand('redo', false);
    
    // Update button states
    this.updateButtonStates();
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.editor) return;
    
    // Check for Ctrl+Z / Cmd+Z (Undo)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
    }
    
    // Check for Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z (Redo)
    if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && event.shiftKey)) {
      event.preventDefault();
      this.redo();
    }
  };
  
  private updateButtonStates = (): void => {
    if (!this.editor) return;
    
    // Unfortunately, there's no direct way to check if undo/redo is available
    // We need to implement a workaround or just keep the buttons enabled
    
    // In a more complete implementation, we could track content changes
    // and maintain our own undo/redo stack to know when to enable/disable
    
    // For now, we'll keep both buttons enabled and let the browser handle
    // whether an undo/redo operation can be performed
    
    // Ideally, we might track content changes and disable buttons when
    // there's nothing to undo/redo, but that's beyond the scope here
  };
  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('input', this.updateButtonStates);
    }
    
    super.destroy();
  }
}