import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { UnderlineModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

export class UnderlinePlugin extends FormattingPlugin {
  private modelAdapter: UnderlineModelAdapter;
  
  constructor() {
    super(
      'underline',
      'underline',
      'Underline',
      'openrte-underline-button',
      {
        tagNames: ['U'],
        defaultTag: 'u',
        command: 'underline'
      }
    );
    this.modelAdapter = new UnderlineModelAdapter();
  }
  
  init(editor: Editor): void {
    super.init(editor);
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    button.innerHTML = '';
    button.appendChild(createIcon('underline'));
    return button;
  }
  
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
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