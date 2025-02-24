// src/plugins/textFormatting/index.ts

import { Plugin } from '../../core/plugin';
import { Editor } from '../../core/editor';
import { createButton } from '../../ui/button';
import { VNode } from '../../core/virtualDom';
import { SelectionManager } from '../../core/selection';

export class TextFormattingPlugin implements Plugin {
  protected commands: { [key: string]: () => void };
  private editor: HTMLElement;
  private selectionManager: SelectionManager;
  private keyboardShortcuts: { [key: string]: string };

  constructor(editor: HTMLElement) {
    this.editor = editor;
    this.selectionManager = new SelectionManager(editor);
    
    // Define commands with bound this context to avoid issues
    this.commands = {
      bold: this.toggleFormat.bind(this, 'strong'),
      italic: this.executeItalic.bind(this),  // Use the executeItalic method directly
      underline: this.toggleFormat.bind(this, 'u')
    };
    
    // Define keyboard shortcuts
    this.keyboardShortcuts = {
      'b': 'bold',
      'i': 'italic',
      'u': 'underline'
    };
    
    console.log('TextFormattingPlugin constructor completed');
  }

  // Add public methods to access protected commands
  public executeBold(): void {
    console.log('executeBold called');
    
    // Focus the editor to ensure execCommand works
    const contentArea = this.editor.querySelector('.openrte-content');
    if (contentArea) {
      (contentArea as HTMLElement).focus();
    }
    
    try {
      document.execCommand('bold', false);
      console.log('Applied bold using execCommand');
    } catch (e) {
      console.error('Error applying bold with execCommand:', e);
      // Fallback to manual formatting
      this.toggleFormat('strong');
    }
  }

  public executeItalic(): void {
    console.log('executeItalic called');
    
    // Save current selection
    const selection = window.getSelection();
    if (!selection?.rangeCount) {
      console.log('No selection found');
      return;
    }
    
    // Focus the editor to ensure execCommand works
    const contentArea = this.editor.querySelector('.openrte-content');
    if (contentArea) {
      (contentArea as HTMLElement).focus();
    }
    
    // Use execCommand directly for italic - most reliable approach
    try {
      document.execCommand('italic', false);
      console.log('Applied italic using execCommand');
    } catch (e) {
      console.error('Error applying italic with execCommand:', e);
      
      // Last resort fallback
      try {
        // Try document.createElement approach
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          const iNode = document.createElement('i');
          range.surroundContents(iNode);
        }
      } catch (e2) {
        console.error('All italic formatting methods failed:', e2);
      }
    }
  }

  public executeUnderline(): void {
    console.log('executeUnderline called');
    
    // Focus the editor to ensure execCommand works
    const contentArea = this.editor.querySelector('.openrte-content');
    if (contentArea) {
      (contentArea as HTMLElement).focus();
    }
    
    try {
      document.execCommand('underline', false);
      console.log('Applied underline using execCommand');
    } catch (e) {
      console.error('Error applying underline with execCommand:', e);
      // Fallback to manual formatting
      this.toggleFormat('u');
    }
  }

  init(editor: Editor): void {
    // Initialize plugin
    console.log('TextFormattingPlugin initialized with editor', editor);
    
    // Add direct event listeners to ensure they work
    setTimeout(() => {
      this.attachDirectEventListeners();
    }, 100);
  }

  public attachDirectEventListeners(): void {
    // Find the buttons by their text/labels
    const buttons = Array.from(this.editor.querySelectorAll('button'));
    console.log('Found buttons:', buttons);
    
    buttons.forEach(button => {
      const text = button.textContent?.trim();
      if (text === 'B') {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('Bold button clicked directly, executing bold');
          this.executeBold();
        });
      } else if (text === 'I') {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('Italic button clicked directly, executing italic');
          this.executeItalic();
        });
      } else if (text === 'U') {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('Underline button clicked directly, executing underline');
          this.executeUnderline();
        });
      }
    });
  }

  createToolbar(): VNode[] {
    console.log('Creating toolbar buttons');
    return [
      createButton('B', (e) => {
        e.preventDefault();
        console.log('Bold button clicked via virtual DOM');
        this.executeBold();
      }),
      createButton('I', (e) => {
        e.preventDefault();
        console.log('Italic button clicked via virtual DOM');
        this.executeItalic();
      }),
      createButton('U', (e) => {
        e.preventDefault();
        console.log('Underline button clicked via virtual DOM');
        this.executeUnderline();
      })
    ];
  }

  // Get keyboard shortcuts for the editor
  getKeyboardShortcuts(): { [key: string]: string } {
    return this.keyboardShortcuts;
  }

  // Execute a command by name
  executeCommand(commandName: string): void {
    console.log(`Executing command: ${commandName}`);
    
    // Map command names to their respective methods
    switch(commandName.toLowerCase()) {
      case 'bold':
        this.executeBold();
        break;
      case 'italic':
        this.executeItalic();
        break;
      case 'underline':
        this.executeUnderline();
        break;
      default:
        console.warn(`Command not found: ${commandName}`);
    }
  }

  destroy(): void {
    this.commands = {};
  }

  private toggleFormat(tag: string): void {
    console.log(`Toggling format: ${tag}`);
    const selection = window.getSelection();
    if (!selection?.rangeCount) {
      console.log('No selection found');
      return;
    }
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      console.log('Range is collapsed, cannot format empty selection');
      return;
    }

    try {
      // Check if we're already in this format
      if (this.isFormatActive(tag)) {
        console.log(`Format ${tag} is active, removing it`);
        this.unwrapFormat(range, tag);
      } else {
        console.log(`Format ${tag} is not active, applying it`);
        // Create the proper element for the formatting
        const element = document.createElement(tag);
        
        // For em tag, ensure proper styling
        if (tag === 'em') {
          element.style.fontStyle = 'italic';
        }
        
        // Apply the formatting
        try {
          range.surroundContents(element);
        } catch (error) {
          console.error('Error applying format with surroundContents:', error);
          
          // Use a more robust approach for complex selections
          const fragment = range.extractContents();
          element.appendChild(fragment);
          range.insertNode(element);
          
          // Restore selection
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } catch (error) {
      console.error('Error applying format:', error);
      
      // Fallback approach for complex selections
      const documentFragment = range.extractContents();
      const element = document.createElement(tag);
      
      // For em tag, ensure proper styling
      if (tag === 'em') {
        element.style.fontStyle = 'italic';
      }
      
      element.appendChild(documentFragment);
      range.insertNode(element);
      
      // Cleanup empty format elements
      this.cleanupEmptyNodes(this.editor);
      
      // Restore selection after modification
      const newRange = document.createRange();
      newRange.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  private isFormatActive(tagName: string): boolean {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;
    
    let node: Node | null = selection.anchorNode;
    
    // Check for text node
    if (node && node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    while (node && node !== this.editor) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        // Check for exact tag match
        if (element.tagName.toLowerCase() === tagName.toLowerCase()) {
          return true;
        }
        
        // Special case for italic - check for both 'em' and 'i' tags or style
        if (tagName.toLowerCase() === 'i' || tagName.toLowerCase() === 'em') {
          if (element.tagName.toLowerCase() === 'i' || 
              element.tagName.toLowerCase() === 'em' ||
              window.getComputedStyle(element).fontStyle === 'italic') {
            return true;
          }
        }
      }
      node = node.parentNode;
    }
    return false;
  }

  private unwrapFormat(range: Range, tagName: string): void {
    let node: Node | null = range.commonAncestorContainer;
    
    // If text node, get parent
    if (node && node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Find the formatting element
    let targetElement: Element | null = null;
    
    while (node && node !== this.editor) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.tagName.toLowerCase() === tagName.toLowerCase()) {
          targetElement = element;
          break;
        }
        
        // Special case for italic
        if (tagName.toLowerCase() === 'em' && 
            (element.tagName.toLowerCase() === 'i' || 
             window.getComputedStyle(element).fontStyle === 'italic')) {
          targetElement = element;
          break;
        }
      }
      node = node.parentNode;
    }
    
    if (targetElement && targetElement !== this.editor) {
      const parent = targetElement.parentNode;
      if (parent) {
        // Create a document fragment to hold all children
        const fragment = document.createDocumentFragment();
        
        // Move all children to the fragment
        while (targetElement.firstChild) {
          fragment.appendChild(targetElement.firstChild);
        }
        
        // Insert the fragment before the target element
        parent.insertBefore(fragment, targetElement);
        
        // Remove the empty formatting element
        parent.removeChild(targetElement);
        
        // Restore selection
        const selection = window.getSelection();
        if (selection) {
          const newRange = document.createRange();
          newRange.setStart(range.startContainer, range.startOffset);
          newRange.setEnd(range.endContainer, range.endOffset);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  }

  private cleanupEmptyNodes(root: Node): void {
    const treeWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          // Check if the node is empty (no text or only whitespace)
          return (node.textContent?.trim() === '' && 
                 node.childNodes.length === 0) ? 
            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    const emptyNodes: Node[] = [];
    let currentNode = treeWalker.nextNode();
    
    while (currentNode) {
      emptyNodes.push(currentNode);
      currentNode = treeWalker.nextNode();
    }
    
    // Remove empty nodes
    emptyNodes.forEach(node => {
      if (node.parentNode && 
          node !== this.editor && 
          !this.editor.isEqualNode(node)) {
        node.parentNode.removeChild(node);
      }
    });
  }
}