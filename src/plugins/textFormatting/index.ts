import { Plugin } from '../../core/plugin';
import { Editor } from '../../core/editor';
import { createButton } from '../../ui/button';
import { VNode } from '../../core/virtualDom';
import { SelectionManager } from '../../core/selection';

export class TextFormattingPlugin implements Plugin {
  protected commands: { [key: string]: () => void };
  private editor: HTMLElement;
  private selectionManager: SelectionManager;

  constructor(editor: HTMLElement) {
    this.editor = editor;
    this.selectionManager = new SelectionManager(editor);
    this.commands = {
      bold: () => this.toggleFormat('strong'),
      italic: () => this.toggleFormat('em'),
      underline: () => this.toggleFormat('u')
    };
  }

  // Add public methods to access protected commands
  public executeBold(): void {
    this.commands.bold();
  }

  public executeItalic(): void {
    this.commands.italic();
  }

  public executeUnderline(): void {
    this.commands.underline();
  }

  init(editor: Editor): void {
    // Initialize plugin
    console.log('TextFormattingPlugin initialized');
  }

  createToolbar(): VNode[] {
    return [
      createButton('B', () => {
        console.log('Bold button clicked');
        this.commands.bold();
      }),
      createButton('I', () => {
        console.log('Italic button clicked');
        this.commands.italic();
      }),
      createButton('U', () => {
        console.log('Underline button clicked');
        this.commands.underline();
      })
    ];
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
    try {
      // Check if we're already in this format
      if (this.isFormatActive(tag)) {
        this.unwrapFormat(range, tag);
      } else {
        const element = document.createElement(tag);
        range.surroundContents(element);
      }
    } catch (error) {
      console.error('Error applying format:', error);
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
}