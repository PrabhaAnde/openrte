import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';

export class ItalicPlugin extends FormattingPlugin {
  constructor() {
    super(
      'italic', 
      'italic', 
      'Italic', 
      'openrte-italic-button',
      { tagNames: ['I', 'EM'], defaultTag: 'em' }
    );
  }
  
  init(editor: Editor): void {
    super.init(editor);
    // Add keyboard shortcut
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    button.innerHTML = '';
    button.appendChild(createIcon('italic'));
    return button;
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+I / Cmd+I
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      this.execute();
    }
  };
  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    super.destroy();
  }
}