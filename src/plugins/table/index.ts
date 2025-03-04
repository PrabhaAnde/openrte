import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';
import { TableModelAdapter } from './model-adapter';
import { PluginModelAdapter } from '../../model/plugin-model-adapter';

export class TablePlugin extends BasePlugin {
  private modelAdapter: TableModelAdapter;
  
  constructor() {
    super('table', 'table', 'Insert Table', 'openrte-table-button');
    this.modelAdapter = new TableModelAdapter();
  }
  
  init(editor: Editor): void {
    super.init(editor);
  }
  
  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    // Clear any existing content and add the icon
    button.innerHTML = '';
    button.appendChild(createIcon('table'));
    return button;
  }
  
  execute(): void {
    if (!this.editor) return;
    
    if (this.supportsDocumentModel() && typeof this.getModelAdapter === 'function') {
      // Use model-based execution if supported
      const model = this.editor.getDocumentModel();
      const range = this.editor.getDocumentRange();
      
      if (model && range) {
        // Table insertion implementation
        const rows = parseInt(prompt('Number of rows:', '2') || '2', 10);
        const cols = parseInt(prompt('Number of columns:', '2') || '2', 10);
        
        if (rows > 0 && cols > 0) {
          const adapter = this.getModelAdapter();
          adapter.applyToModel(model, range, {
            action: 'createTable',
            rows,
            columns: cols
          });
          this.editor.renderDocument();
          
          // Emit event for model execution
          this.emitEvent('model-execute', {
            model,
            range,
            plugin: this
          });
          
          return;
        }
      }
    }
    
    // Fall back to DOM-based execution
    this.executeDOMBased();
  }
  
  /**
   * DOM-based execution for backward compatibility
   */
  protected executeDOMBased(): void {
    if (!this.editor) return;
    
    // Table insertion implementation
    const rows = parseInt(prompt('Number of rows:', '2') || '2', 10);
    const cols = parseInt(prompt('Number of columns:', '2') || '2', 10);
    
    if (rows > 0 && cols > 0) {
      this.insertTable(rows, cols);
    }
  }
  
  private insertTable(rows: number, cols: number): void {
    if (!this.editor) return;
    
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '1em';
    table.setAttribute('border', '1');
    
    const tbody = document.createElement('tbody');
    
    for (let i = 0; i < rows; i++) {
      const row = document.createElement('tr');
      
      for (let j = 0; j < cols; j++) {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        cell.style.padding = '8px';
        cell.style.border = '1px solid #ddd';
        cell.innerHTML = `Cell ${i + 1},${j + 1}`;
        row.appendChild(cell);
      }
      
      tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    
    // Insert the table at the current selection
    const selectionManager = this.editor.getSelectionManager();
    const range = selectionManager.getRange();
    
    if (range) {
      range.deleteContents();
      range.insertNode(table);
      
      // Move cursor after the table
      const newRange = document.createRange();
      newRange.setStartAfter(table);
      newRange.collapse(true);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
    
    // Focus editor
    this.editor.focus();
  }
  
  /**
   * Return the model adapter for this plugin
   */
  getModelAdapter(): PluginModelAdapter {
    return this.modelAdapter;
  }
  
  destroy(): void {
    super.destroy();
  }
}