import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

export class ClipboardPlugin extends BasePlugin {
  private cutButton: HTMLElement;
  private copyButton: HTMLElement;
  private pasteButton: HTMLElement;
  
  constructor() {
    super('clipboard', null, 'Clipboard', 'openrte-clipboard-control');
    
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
    
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      // Get selected content
      const range = selection.getRangeAt(0);
      const selectedContent = range.cloneContents();
      
      // Create a temporary element to extract text and HTML
      const temp = document.createElement('div');
      temp.appendChild(selectedContent);
      const text = temp.textContent || '';
      const html = temp.innerHTML;
      
      // Write content to clipboard
      navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })
      ]).then(() => {
        // Delete the content after successful copy
        range.deleteContents();
        
        // Collapse the selection
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }).catch(error => {
        console.error('Failed to cut to clipboard:', error);
        
        // Fallback: Try simpler method
        navigator.clipboard.writeText(text).then(() => {
          range.deleteContents();
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }).catch(() => {
          // Final fallback: Focus element and suggest keyboard shortcut
          this.editor?.getContentArea().focus();
          console.warn('Please use Ctrl+X to cut the selected content');
        });
      });
    }
    
    // Update button states
    this.updateButtonStates();
  }
  
  private copy(): void {
    if (!this.editor) return;
    
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      // Get selected content
      const range = selection.getRangeAt(0);
      const selectedContent = range.cloneContents();
      
      // Create a temporary element to extract text and HTML
      const temp = document.createElement('div');
      temp.appendChild(selectedContent);
      const text = temp.textContent || '';
      const html = temp.innerHTML;
      
      // Write content to clipboard
      navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })
      ]).catch(error => {
        console.error('Failed to copy to clipboard:', error);
        
        // Fallback: Try simpler writeText method
        navigator.clipboard.writeText(text).catch(err => {
          console.error('Could not copy text:', err);
          
          // Final fallback: Focus element and suggest keyboard shortcut
          this.editor?.getContentArea().focus();
          console.warn('Please use Ctrl+C to copy the selected content');
        });
      });
    }
    
    // Update button states
    this.updateButtonStates();
  }
  
  private paste(): void {
    if (!this.editor) return;
    
    const contentArea = this.editor.getContentArea();
    
    // Use the modern Clipboard API
    if (navigator.clipboard) {
      // Try to get text content first
      navigator.clipboard.readText()
        .then(text => {
          // Insert the text at current selection
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            
            // Move cursor to end of inserted text
            range.setStartAfter(range.endContainer);
            range.setEndAfter(range.endContainer);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        })
        .catch(() => {
          // Try to get all clipboard items if text fails
          if (navigator.clipboard.read) {
            navigator.clipboard.read()
              .then(clipboardItems => {
                this.processClipboardItems(clipboardItems);
              })
              .catch(() => {
                // If both methods fail, request manual paste from user
                contentArea.focus();
                console.warn('Please use Ctrl+V to paste content');
              });
          }
        });
    } else {
      // If Clipboard API is not available
      // Focus the editor and let the paste event handler take over
      contentArea.focus();
      console.warn('Please use Ctrl+V to paste content');
    }
    
    // Update button states
    this.updateButtonStates();
  }
  
  private async processClipboardItems(clipboardItems: ClipboardItems): Promise<void> {
    if (!this.editor) return;
    
    for (const item of clipboardItems) {
      // Check for HTML content
      if (item.types.includes('text/html')) {
        const blob = await item.getType('text/html');
        const html = await blob.text();
        
        // Insert the HTML at current selection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          // Create a temporary container
          const temp = document.createElement('div');
          temp.innerHTML = html;
          
          // Sanitize HTML if needed (you may want to use a library for this)
          // ...sanitize code here...
          
          // Insert the nodes
          const fragment = document.createDocumentFragment();
          while (temp.firstChild) {
            fragment.appendChild(temp.firstChild);
          }
          
          range.insertNode(fragment);
        }
        return;
      }
      
      // Fallback to plain text
      if (item.types.includes('text/plain')) {
        const blob = await item.getType('text/plain');
        const text = await blob.text();
        
        // Insert the text at current selection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
        }
        return;
      }
      
      // Handle image content
      if (item.types.some(type => type.startsWith('image/'))) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const url = URL.createObjectURL(blob);
          
          // Insert image at current selection
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            const img = document.createElement('img');
            img.src = url;
            range.insertNode(img);
          }
        }
      }
    }
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.editor) return;
    
    // For keyboard shortcuts (Ctrl+X, Ctrl+C, Ctrl+V)
    // Let the browser handle them and update our button states
    if ((event.ctrlKey || event.metaKey) && 
        (event.key.toLowerCase() === 'x' || 
         event.key.toLowerCase() === 'c' || 
         event.key.toLowerCase() === 'v')) {
      // Just update button states afterward
      setTimeout(this.updateButtonStates, 0);
    }
  };
  
  private handlePaste = (event: ClipboardEvent): void => {
    // For advanced paste handling
    if (!this.editor) return;
    
    // If we want to handle it manually (optional)
    // event.preventDefault();
    
    // Get clipboard data
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;
    
    // Check for HTML content
    const html = clipboardData.getData('text/html');
    if (html) {
      // Insert the HTML at current selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        event.preventDefault(); // Now we do want to prevent default
        
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Create a temporary container
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Insert the nodes
        const fragment = document.createDocumentFragment();
        while (temp.firstChild) {
          fragment.appendChild(temp.firstChild);
        }
        
        range.insertNode(fragment);
      }
    }
    
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