import { Plugin } from '../../core/plugin';
import { Editor } from '../../core/editor';
import { createButton } from '../../ui/button';
import { VNode } from '../../core/virtualDom';

export class TextFormattingPlugin implements Plugin {
  protected commands: { [key: string]: () => void };
  private editor: HTMLElement;

  constructor(editor: HTMLElement) {
    this.editor = editor;
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
  }

  createToolbar(): VNode[] {
    return [
      createButton('B', () => this.commands.bold()),
      createButton('I', () => this.commands.italic()),
      createButton('U', () => this.commands.underline())
    ];
  }

  destroy(): void {
    this.commands = {};
  }

  private toggleFormat(tag: string): void {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const element = document.createElement(tag);
    range.surroundContents(element);
  }
}