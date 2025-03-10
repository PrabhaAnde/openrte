import { FormattingPlugin } from '../formatting-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { BoldModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

export class BoldPlugin extends FormattingPlugin {
  private modelAdapter: BoldModelAdapter;
  
  constructor() {
    super(
      'bold',
      'bold',
      'Bold',
      'openrte-bold-button',
      { 
        tagNames: ['B', 'STRONG'], 
        defaultTag: 'strong',
        command: 'bold'  // Use native command
      }
    );
    this.modelAdapter = new BoldModelAdapter();
  }
  
  init(editor: Editor): void {
    super.init(editor);
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    button.innerHTML = '';
    button.appendChild(createIcon('bold'));
    return button;
  }
  
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
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