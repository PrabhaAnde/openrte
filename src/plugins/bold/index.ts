import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';

export class BoldPlugin extends FormattingPlugin {
  constructor() {
    super(
      'bold', 
      'bold', 
      'Bold', 
      'openrte-bold-button',
      { tagNames: ['B', 'STRONG'], defaultTag: 'strong' }
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
    button.appendChild(createIcon('bold'));
    return button;
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+B / Cmd+B
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.execute();
    }
  };
  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    super.destroy();
  }
}