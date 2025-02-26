import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';

export class UndoRedoPlugin extends BasePlugin {
  private undoButton: HTMLElement;
  private redoButton: HTMLElement;
  
  // State management for undo/redo functionality
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private isUndoRedo = false;
  private maxStackSize = 50;
  
  constructor() {
    super('undoRedo', null, 'Undo/Redo', 'openrte-undo-redo-control');
    
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
      contentArea.addEventListener('input', this.handleInput);
      
      // Save initial state
      this.saveState();
      
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
    if (!this.editor || this.undoStack.length <= 1) return;
    
    // Get current state and compare with last saved state
    const contentArea = this.editor.getContentArea();
    const currentHtml = contentArea.innerHTML;
    const lastState = this.undoStack[this.undoStack.length - 1];
    
    // Save current state if different from last state
    if (currentHtml !== lastState && !this.isUndoRedo) {
      this.saveState();
    }
    
    // Now pop the current state (which we just saved if needed)
    const poppedState = this.undoStack.pop();
    if (poppedState) {
      // Add to redo stack
      this.redoStack.push(poppedState);
    }
    
    // Get the previous state to restore
    const previousState = this.undoStack[this.undoStack.length - 1];
    if (previousState) {
      // Apply the previous state
      this.isUndoRedo = true;
      contentArea.innerHTML = previousState;
      this.isUndoRedo = false;
      
      // Dispatch input event to notify of changes
      contentArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Update button states
    this.updateButtonStates();
  }
  
  private redo(): void {
    if (!this.editor || this.redoStack.length === 0) return;
    
    // Get the next state to restore
    const nextState = this.redoStack.pop();
    if (nextState) {
      // Add current state to undo stack
      this.undoStack.push(nextState);
      
      // Apply the next state
      this.isUndoRedo = true;
      this.editor.getContentArea().innerHTML = nextState;
      this.isUndoRedo = false;
      
      // Dispatch input event to notify of changes
      this.editor.getContentArea().dispatchEvent(new Event('input', { bubbles: true }));
    }
    
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
  
  private handleInput = (): void => {
    // Don't save state if this change is from an undo/redo operation
    if (this.isUndoRedo) return;
    
    // Debounce state saving to avoid too many snapshots on rapid typing
    this.saveState();
    
    // Clear redo stack when new changes are made
    if (this.redoStack.length > 0) {
      this.redoStack = [];
    }
    
    // Update button states
    this.updateButtonStates();
  };
  
  private saveState(): void {
    if (!this.editor) return;
    
    const contentArea = this.editor.getContentArea();
    const html = contentArea.innerHTML;
    
    // Only save if content has changed
    if (this.undoStack.length === 0 || this.undoStack[this.undoStack.length - 1] !== html) {
      this.undoStack.push(html);
      
      // Limit stack size to prevent memory issues
      if (this.undoStack.length > this.maxStackSize) {
        this.undoStack.shift();
      }
    }
  }
  
  private updateButtonStates = (): void => {
    if (!this.editor) return;
    
    // Enable/disable undo button based on stack state
    (this.undoButton as HTMLButtonElement).disabled = this.undoStack.length <= 1;
    
    // Enable/disable redo button based on stack state
    (this.redoButton as HTMLButtonElement).disabled = this.redoStack.length === 0;
  };
  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('input', this.handleInput);
    }
    
    // Clear state
    this.undoStack = [];
    this.redoStack = [];
    
    super.destroy();
  }
}