import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';

interface TableSize {
  rows: number;
  cols: number;
}

export class TablePlugin extends BasePlugin {
  private dropdownMenu: HTMLElement;
  
  constructor() {
    super('table', 'Table', 'openrte-table-button');
    
    // Create dropdown menu
    this.dropdownMenu = document.createElement('div');
    this.dropdownMenu.className = 'openrte-table-dropdown';
    this.dropdownMenu.style.display = 'none';
    
    // Add common table sizes
    this.addTableSizeOption(2, 2);
    this.addTableSizeOption(3, 3);
    this.addTableSizeOption(4, 3);
    
    // Add custom table option
    const customOption = document.createElement('div');
    customOption.className = 'openrte-table-option';
    customOption.textContent = 'Custom...';
    customOption.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.createCustomTable();
      this.hideDropdown();
    });
    this.dropdownMenu.appendChild(customOption);
    
    // Add dropdown to document
    document.body.appendChild(this.dropdownMenu);
    
    // Modify button behavior to show dropdown
    this.button.removeEventListener('click', this.handleClick.bind(this));
    this.button.addEventListener('click', this.toggleDropdown.bind(this));
    
    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }
  
  init(editor: Editor): void {
    super.init(editor);
  }
  
  execute(): void {
    // We're overriding the default execution with the dropdown
  }
  
  private addTableSizeOption(rows: number, cols: number): void {
    const option = document.createElement('div');
    option.className = 'openrte-table-option';
    option.textContent = `${rows}×${cols} Table`;
    option.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.createTable({ rows, cols });
      this.hideDropdown();
    });
    this.dropdownMenu.appendChild(option);
  }
  
  private toggleDropdown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.dropdownMenu.style.display === 'none') {
      this.showDropdown();
    } else {
      this.hideDropdown();
    }
  }
  
  private showDropdown(): void {
    // Position the dropdown below the button
    const rect = this.button.getBoundingClientRect();
    this.dropdownMenu.style.top = `${rect.bottom + window.scrollY}px`;
    this.dropdownMenu.style.left = `${rect.left + window.scrollX}px`;
    this.dropdownMenu.style.display = 'block';
  }
  
  private hideDropdown(): void {
    this.dropdownMenu.style.display = 'none';
  }
  
  private handleOutsideClick = (event: MouseEvent): void => {
    // Skip if clicking the button
    if (event.target === this.button || this.button.contains(event.target as Node)) {
      return;
    }
    
    // Skip if clicking inside the dropdown
    if (this.dropdownMenu.contains(event.target as Node)) {
      return;
    }
    
    this.hideDropdown();
  };
  
  private createCustomTable(): void {
    const rows = prompt('Enter number of rows:', '3');
    const cols = prompt('Enter number of columns:', '3');
    
    if (!rows || !cols) return;
    
    const rowsNum = parseInt(rows, 10);
    const colsNum = parseInt(cols, 10);
    
    if (isNaN(rowsNum) || isNaN(colsNum) || rowsNum < 1 || colsNum < 1) {
      alert('Please enter valid numbers for rows and columns.');
      return;
    }
    
    this.createTable({ rows: rowsNum, cols: colsNum });
  }
  
  private createTable(size: TableSize): void {
    if (!this.editor) return;
    
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '1em';
    table.setAttribute('border', '1');
    
    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    for (let i = 0; i < size.cols; i++) {
      const th = document.createElement('th');
      th.style.padding = '8px';
      th.style.backgroundColor = '#f2f2f2';
      th.style.textAlign = 'left';
      th.style.borderBottom = '2px solid #ddd';
      th.innerHTML = `Header ${i + 1}`;
      headerRow.appendChild(th);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    
    for (let i = 1; i < size.rows; i++) {
      const row = document.createElement('tr');
      
      for (let j = 0; j < size.cols; j++) {
        const td = document.createElement('td');
        td.style.padding = '8px';
        td.style.border = '1px solid #ddd';
        td.innerHTML = `Cell ${i},${j + 1}`;
        row.appendChild(td);
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
  
  destroy(): void {
    document.removeEventListener('click', this.handleOutsideClick);
    
    // Remove dropdown from DOM
    if (this.dropdownMenu.parentNode) {
      this.dropdownMenu.parentNode.removeChild(this.dropdownMenu);
    }
    
    super.destroy();
  }
}