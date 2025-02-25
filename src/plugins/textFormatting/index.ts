// src/plugins/textFormatting/index.ts
import { Plugin } from '../../core/plugin';
import { Editor } from '../../core/editor';
import { createButton } from '../../ui/button';
import { SelectionManager } from '../../core/selection';

export class TextFormattingPlugin implements Plugin {
  protected commands: { [key: string]: () => void };
  private editor: HTMLElement;
  private selectionManager: SelectionManager;
  private buttons: HTMLButtonElement[] = [];

  constructor(editor: HTMLElement) {
    this.editor = editor;
    this.selectionManager = new SelectionManager(editor);
    
    // Define commands with bound this context
    this.commands = {
      bold: this.toggleFormat.bind(this, 'strong'),
      italic: this.toggleFormat.bind(this, 'em'),
      underline: this.toggleFormat.bind(this, 'u')
    };
    
    console.log('TextFormattingPlugin constructor completed');
  }

  // Public methods to access commands
  public executeBold(): void {
    console.log('executeBold called');
    this.commands.bold();
  }

  public executeItalic(): void {
    console.log('executeItalic called');
    this.commands.italic();
  }

  public executeUnderline(): void {
    console.log('executeUnderline called');
    this.commands.underline();
  }

  init(editor: Editor): void {
    console.log('TextFormattingPlugin initialized with editor', editor);
  }

  createToolbar(container: HTMLElement): void {
    // Create buttons and append directly to the container
    const boldButton = createButton('B', (e) => {
      e.preventDefault();
      console.log('Bold button clicked');
      this.executeBold();
    });
    
    const italicButton = createButton('I', (e) => {
      e.preventDefault();
      console.log('Italic button clicked');
      this.executeItalic();
    });
    
    const underlineButton = createButton('U', (e) => {
      e.preventDefault();
      console.log('Underline button clicked');
      this.executeUnderline();
    });
    
    // Store references to buttons
    this.buttons = [boldButton, italicButton, underlineButton];
    
    // Append buttons to container
    this.buttons.forEach(button => container.appendChild(button));
  }

  destroy(): void {
    // Clean up event listeners
    this.buttons.forEach(button => {
      button.removeEventListener('click', () => {});
    });
    this.buttons = [];
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
        const element = document.createElement(tag);
        range.surroundContents(element);
      }
    } catch (error) {
      console.error('Error applying format:', error);
      
      // Fallback approach for complex selections
      const documentFragment = range.extractContents();
      const element = document.createElement(tag);
      element.appendChild(documentFragment);
      range.insertNode(element);
      
      // Cleanup empty format elements
      this.cleanupEmptyNodes(this.editor);
    }
  }

  private isFormatActive(tagName: string): boolean {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;
    
    let node: Node | null = selection.anchorNode;
    while (node && node !== this.editor) {
      if (node.nodeType === Node.ELEMENT_NODE && 
          (node as Element).tagName.toLowerCase() === tagName.toLowerCase()) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  private unwrapFormat(range: Range, tagName: string): void {
    let node: Node | null = range.commonAncestorContainer;
    
    // Find the formatting element
    while (node && node !== this.editor) {
      if (node.nodeType === Node.ELEMENT_NODE && 
          (node as Element).tagName.toLowerCase() === tagName.toLowerCase()) {
        break;
      }
      node = node.parentNode;
    }
    
    if (node && node !== this.editor) {
      const parent = node.parentNode;
      if (parent) {
        // Move all children out
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        // Remove the empty formatting element
        parent.removeChild(node);
      }
    }
  }

  private cleanupEmptyNodes(root: Node): void {
    const treeWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          return (node.childNodes.length === 0) ? 
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
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
  }
}