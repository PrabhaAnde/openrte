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
    
    // Define commands with bound this context
    this.commands = {
      bold: () => this.execFormatCommand('bold'),
      italic: () => this.execFormatCommand('italic'),
      underline: () => this.execFormatCommand('underline')
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

  // Use document.execCommand for better browser compatibility
  private execFormatCommand(command: string): void {
    console.log(`Executing format command: ${command}`);
    document.execCommand(command, false);
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
      
      // Remove any existing listeners to avoid duplicates
      button.replaceWith(button.cloneNode(true));
      const newButton = this.editor.querySelector(`button:contains('${text}')`) || button;
      
      // Add new listener
      if (text === 'B') {
        newButton.addEventListener('click', () => this.executeBold());
        console.log('Added manual click listener to B button');
      } else if (text === 'I') {
        newButton.addEventListener('click', () => this.executeItalic());
        console.log('Added manual click listener to I button');
      } else if (text === 'U') {
        newButton.addEventListener('click', () => this.executeUnderline());
        console.log('Added manual click listener to U button');
      }
    });
  }

  createToolbar(): VNode[] {
    console.log('Creating toolbar buttons');
    return [
      createButton('B', () => {
        console.log('Bold button clicked via virtual DOM');
        this.executeBold();
      }),
      createButton('I', () => {
        console.log('Italic button clicked via virtual DOM');
        this.executeItalic();
      }),
      createButton('U', () => {
        console.log('Underline button clicked via virtual DOM');
        this.executeUnderline();
      })
    ];
  }

  destroy(): void {
    this.commands = {};
  }
}