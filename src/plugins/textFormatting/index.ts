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
    
    // Define commands with bound this context to avoid issues
    this.commands = {
      bold: () => document.execCommand('bold', false),
      italic: () => document.execCommand('italic', false),
      underline: () => document.execCommand('underline', false)
    };
    
    console.log('TextFormattingPlugin initialized with editor element:', editor);
  }

  // Public methods to access commands
  public executeBold(): void {
    console.log('executeBold called');
    document.execCommand('bold', false);
  }

  public executeItalic(): void {
    console.log('executeItalic called');
    document.execCommand('italic', false);
  }

  public executeUnderline(): void {
    console.log('executeUnderline called');
    document.execCommand('underline', false);
  }

  init(editor: Editor): void {
    console.log('TextFormattingPlugin init method called with editor instance');
    
    // Add manual event listeners after a short delay
    setTimeout(() => {
      this.addManualButtonListeners();
    }, 500);
  }

  private addManualButtonListeners(): void {
    // Find all buttons in the editor
    const buttons = this.editor.querySelectorAll('button');
    console.log(`Found ${buttons.length} buttons for manual listeners`);
    
    // Add direct event listeners as a fallback
    buttons.forEach(button => {
      const text = button.textContent?.trim() || '';
      
      // Instead of replacing, just add another listener
      if (text === 'B') {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Bold button clicked manually');
          this.executeBold();
        });
        console.log('Added manual click listener to B button');
      } else if (text === 'I') {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Italic button clicked manually');
          this.executeItalic();
        });
        console.log('Added manual click listener to I button');
      } else if (text === 'U') {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Underline button clicked manually');
          this.executeUnderline();
        });
        console.log('Added manual click listener to U button');
      }
    });
  }

  createToolbar(): VNode[] {
    console.log('Creating toolbar buttons');
    return [
      createButton('B', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Bold button clicked via virtual DOM');
        this.executeBold();
      }),
      createButton('I', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Italic button clicked via virtual DOM');
        this.executeItalic();
      }),
      createButton('U', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Underline button clicked via virtual DOM');
        this.executeUnderline();
      })
    ];
  }

  destroy(): void {
    this.commands = {};
  }
}