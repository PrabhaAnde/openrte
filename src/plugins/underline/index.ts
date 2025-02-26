import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';

export class UnderlinePlugin extends FormattingPlugin {
  constructor() {
    super(
      'underline', 
      'underline', 
      'Underline', 
      'openrte-underline-button',
      { tagNames: ['U'], defaultTag: 'u' }
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
    button.appendChild(createIcon('underline'));
    return button;
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check for Ctrl+U / Cmd+U
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'u') {
      event.preventDefault();
      this.execute();
    }
  };
  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    super.destroy();
  }
}