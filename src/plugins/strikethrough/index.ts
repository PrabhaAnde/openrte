import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';

export class StrikethroughPlugin extends FormattingPlugin {
  constructor() {
    super(
      'strikethrough', 
      'strikethrough', 
      'Strikethrough', 
      'openrte-strikethrough-button',
      { tagNames: ['S', 'STRIKE', 'DEL'], defaultTag: 's' }
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
    button.appendChild(createIcon('strikethrough'));
    return button;
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+Shift+S shortcut
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.execute();
    }
  };
  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    super.destroy();
  }
}