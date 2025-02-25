import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

export class ClipboardPlugin extends BasePlugin {
  private cutButton: HTMLElement;
  private copyButton: HTMLElement;
  private pasteButton: HTMLElement;
  
  constructor() {
    // We'll override the createToolbarControl method
    super('clipboard', '', 'openrte-clipboard-control');
    
    // Create temporary buttons (will be replaced in createToolbarControl)
    this.cutButton = document.createElement('button');
    this.copyButton = document.createElement('button');
    this.pasteButton = document.createElement('button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Add selection change listener to update button states
    document.addEventListener('selectionchange', this.updateButtonStates);
    
    // Add paste event handler to content area
    if (editor) {
      const contentArea = editor.getContentArea();
      contentArea.addEventListener('paste', this.handlePaste);
    }
    
    // Initialize button states
    this.updateButtonStates();
  }
  
  execute(): void {
    // This is a container plugin, cut/copy/paste have their own methods
  }
  
  createToolbarControl(): HTMLElement {
    // Create a container for clipboard buttons
    const container = document.createElement('div');
    container.className = 'openrte-clipboard-container';
    container.style.display = 'flex';
    
    // Create cut button
    this.cutButton = document.createElement('button');
    this.cutButton.className = 'openrte-button openrte-cut-button';
    this.cutButton.title = 'Cut (Ctrl+X)';
    this.cutButton.innerHTML = '✂️'; // Scissors emoji
    this.cutButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.cut();
      if (this.editor) {
        this.editor.focus();
      }
    });
    
    // Create copy button
    this.copyButton = document.createElement('button');
    this.copyButton.className = 'openrte-button openrte-copy-button';
    this.copyButton.title = 'Copy (Ctrl+C)';
    this.copyButton.innerHTML = '📋'; // Clipboard emoji
    this.copyButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.copy();
      if (this.editor) {
        this.editor.focus();
      }
    });
    
    // Create paste button
    this.pasteButton = document.createElement('button');
    this.pasteButton.className = 'openrte-button openrte-paste-button';
    this.pasteButton.title = 'Paste (Ctrl+V)';
    this.pasteButton.innerHTML = '📌'; // Pin emoji
    this.pasteButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.paste();
      if (this.editor) {
        this.editor.focus();
      }
    });
    
    // Add buttons to container
    container.appendChild(this.cutButton);
    container.appendChild(this.copyButton);
    container.appendChild(this.pasteButton);
    
    // Initialize button states
    this.updateButtonStates();
    
    return container;
  }
  
  private cut(): void {
    if (!this.editor) return;
    
    document.execCommand('cut', false);
    
    // Update button states
    this.updateButtonStates();
  }
  
  private copy(): void {
    if (!this.editor) return;
    
    document.execCommand('copy', false);
    
    // Update button states
    this.updateButtonStates();
  }
  
  private paste(): void {
    if (!this.editor) return;
    
    // Try to paste using the Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.read) {
      navigator.clipboard.read()
        .then(clipboardItems => {
          // Process clipboard items
          this.processClipboardItems(clipboardItems);
        })
        .catch(error => {
          console.error('Failed to read clipboard contents:', error);
          // Fallback to execCommand
          document.execCommand('paste', false);
        });
    } else {
      // Fallback to execCommand (may require permission)
      document.execCommand('paste', false);
    }
    
    // Update button states
    this.updateButtonStates();
  }
  
  private processClipboardItems(clipboardItems: ClipboardItems): void {
    // This function would process different types of clipboard content
    // For the sake of this implementation, we'll just use the fallback approach
    document.execCommand('paste', false);
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.editor) return;
    
    // Check for Ctrl+X / Cmd+X (Cut)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'x') {
      // Let the default behavior handle it
      // No need to preventDefault()
      
      // Just update button states afterward
      setTimeout(this.updateButtonStates, 0);
    }
    
    // Check for Ctrl+C / Cmd+C (Copy)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      // Let the default behavior handle it
      // No need to preventDefault()
      
      // Just update button states afterward
      setTimeout(this.updateButtonStates, 0);
    }
    
    // Check for Ctrl+V / Cmd+V (Paste)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      // Let the default behavior and the paste event handler handle it
      // No need to preventDefault()
      
      // Just update button states afterward
      setTimeout(this.updateButtonStates, 0);
    }
  };
  
  private handlePaste = (event: ClipboardEvent): void => {
    // For advanced paste handling, we could process the clipboard data here
    // For example, cleaning up pasted HTML from Word or other sources
    
    if (!this.editor) return;
    
    // For now, we'll let the default paste behavior handle it
    // But in a real implementation, we might want to:
    // 1. Get clipboard data: event.clipboardData
    // 2. Process different formats: HTML, text, images
    // 3. Clean up HTML: remove unwanted styles, tags, etc.
    // 4. Insert the processed content
    
    // Update button states afterward
    setTimeout(this.updateButtonStates, 0);
  };
  
  private updateButtonStates = (): void => {
    if (!this.editor) return;
    
    const selection = window.getSelection();
    const hasSelection = selection && !selection.isCollapsed;
    
    // Enable/disable cut and copy buttons based on selection
    (this.cutButton as HTMLButtonElement).disabled = !hasSelection;
    (this.copyButton as HTMLButtonElement).disabled = !hasSelection;
    
    // We can't reliably know if there's content in the clipboard,
    // so we'll keep the paste button enabled
  };  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('selectionchange', this.updateButtonStates);
    
    if (this.editor) {
      const contentArea = this.editor.getContentArea();
      contentArea.removeEventListener('paste', this.handlePaste);
    }
    
    super.destroy();
  }
}