import { DocumentModel } from '../document-model';
import { DocumentRange } from '../selection-interfaces';
import { ElementNode } from '../interfaces';

export class TableOperations {
  /**
   * Create a table
   */
  static createTable(
    model: DocumentModel,
    range: DocumentRange,
    rows: number,
    columns: number
  ): ElementNode {
    // Create table element
    const table = model.createElementNode('table', {}, []);
    
    // Add rows and cells
    for (let i = 0; i < rows; i++) {
      const row = model.createElementNode('table-row', {}, []);
      
      for (let j = 0; j < columns; j++) {
        // Create cell with default content
        const cell = model.createElementNode(
          'table-cell',
          i === 0 ? { 'cell-type': 'header' } : {}, 
          [model.createElementNode('paragraph', {}, [model.createTextNode('')])]
        );
        
        row.children.push(cell);
      }
      
      table.children.push(row);
    }
    
    // Insert table at range
    if (range) {
      this.insertTableAtRange(model, table, range);
    }
    
    return table;
  }
  
  /**
   * Insert row
   */
  static insertRow(
    model: DocumentModel,
    tablePath: number[],
    rowIndex: number
  ): void {
    // Find table by path
    const table = this.findNodeByPath(model, tablePath);
    if (!table || table.type !== 'table') return;
    
    // Get number of columns from existing rows
    const columnCount = table.children.length > 0 && 
                       table.children[0].type === 'table-row' ? 
                       table.children[0].children.length : 0;
    
    if (columnCount === 0) return;
    
    // Create new row
    const newRow = model.createElementNode('table-row', {}, []);
    
    // Add cells to row
    for (let i = 0; i < columnCount; i++) {
      const cell = model.createElementNode(
        'table-cell', 
        {}, 
        [model.createElementNode('paragraph', {}, [model.createTextNode('')])]
      );
      newRow.children.push(cell);
    }
    
    // Insert row at specified index
    if (rowIndex >= 0 && rowIndex <= table.children.length) {
      table.children.splice(rowIndex, 0, newRow);
    } else {
      // Append to end if index is out of bounds
      table.children.push(newRow);
    }
  }
  
  /**
   * Insert column
   */
  static insertColumn(
    model: DocumentModel,
    tablePath: number[],
    columnIndex: number
  ): void {
    // Find table by path
    const table = this.findNodeByPath(model, tablePath);
    if (!table || table.type !== 'table') return;
    
    // Insert cell in each row
    table.children.forEach((row, rowIndex) => {
      if (row.type !== 'table-row') return;
      
      // Create new cell
      const cell = model.createElementNode(
        'table-cell',
        rowIndex === 0 ? { 'cell-type': 'header' } : {},
        [model.createElementNode('paragraph', {}, [model.createTextNode('')])]
      );
      
      // Insert cell at specified index
      if (columnIndex >= 0 && columnIndex <= row.children.length) {
        row.children.splice(columnIndex, 0, cell);
      } else {
        // Append to end if index is out of bounds
        row.children.push(cell);
      }
    });
  }
  
  /**
   * Delete row
   */
  static deleteRow(
    model: DocumentModel,
    tablePath: number[],
    rowIndex: number
  ): void {
    // Find table by path
    const table = this.findNodeByPath(model, tablePath);
    if (!table || table.type !== 'table') return;
    
    // Delete row at specified index
    if (rowIndex >= 0 && rowIndex < table.children.length) {
      table.children.splice(rowIndex, 1);
      
      // If table is now empty, add a default row
      if (table.children.length === 0) {
        this.insertRow(model, tablePath, 0);
      }
    }
  }
  
  /**
   * Delete column
   */
  static deleteColumn(
    model: DocumentModel,
    tablePath: number[],
    columnIndex: number
  ): void {
    // Find table by path
    const table = this.findNodeByPath(model, tablePath);
    if (!table || table.type !== 'table') return;
    
    // Delete cell in each row
    table.children.forEach(row => {
      if (row.type !== 'table-row') return;
      
      // Delete cell at specified index
      if (columnIndex >= 0 && columnIndex < row.children.length) {
        row.children.splice(columnIndex, 1);
      }
      
      // If row is now empty, add a default cell
      if (row.children.length === 0) {
        row.children.push(
          model.createElementNode(
            'table-cell',
            {},
            [model.createElementNode('paragraph', {}, [model.createTextNode('')])]
          )
        );
      }
    });
  }
  
  /**
   * Merge cells
   */
  static mergeCells(
    model: DocumentModel,
    tablePath: number[],
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): void {
    // Find table by path
    const table = this.findNodeByPath(model, tablePath);
    if (!table || table.type !== 'table') return;
    
    // Ensure start coordinates are less than end coordinates
    if (startRow > endRow || startCol > endCol) {
      [startRow, endRow] = [endRow, startRow];
      [startCol, endCol] = [endCol, startCol];
    }
    
    // Get target cell
    const targetCell = this.getCellAt(table, startRow, startCol);
    if (!targetCell) return;
    
    // Set rowspan and colspan attributes
    if (!targetCell.attributes) {
      targetCell.attributes = {};
    }
    
    const rowspan = endRow - startRow + 1;
    const colspan = endCol - startCol + 1;
    
    if (rowspan > 1) {
      targetCell.attributes['rowspan'] = rowspan.toString();
    }
    
    if (colspan > 1) {
      targetCell.attributes['colspan'] = colspan.toString();
    }
    
    // Remove other cells in the merge range
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        // Skip the target cell
        if (r === startRow && c === startCol) continue;
        
        // Mark cell as part of a merged cell
        const cell = this.getCellAt(table, r, c);
        if (cell) {
          if (!cell.attributes) {
            cell.attributes = {};
          }
          cell.attributes['merged'] = 'true';
        }
      }
    }
  }
  
  /**
   * Split cell
   */
  static splitCell(
    model: DocumentModel,
    tablePath: number[],
    rowIndex: number,
    colIndex: number,
    direction: 'horizontal' | 'vertical'
  ): void {
    // Find table by path
    const table = this.findNodeByPath(model, tablePath);
    if (!table || table.type !== 'table') return;
    
    // Get cell to split
    const cell = this.getCellAt(table, rowIndex, colIndex);
    if (!cell || !cell.attributes) return;
    
    // Get rowspan and colspan
    const rowspan = parseInt(cell.attributes['rowspan'] || '1', 10);
    const colspan = parseInt(cell.attributes['colspan'] || '1', 10);
    
    // Remove rowspan/colspan attributes
    delete cell.attributes['rowspan'];
    delete cell.attributes['colspan'];
    
    if (direction === 'horizontal' && rowspan > 1) {
      // Split horizontally (by rows)
      for (let r = rowIndex + 1; r < rowIndex + rowspan; r++) {
        const row = table.children[r] as ElementNode;
        if (!row || row.type !== 'table-row') continue;
        
        // Create new cells for this row
        for (let c = 0; c < colspan; c++) {
          const newCell = model.createElementNode(
            'table-cell',
            {},
            [model.createElementNode('paragraph', {}, [model.createTextNode('')])]
          );
          
          // Find position to insert
          let insertPos = colIndex;
          for (let i = 0; i < colIndex; i++) {
            const prevCell = row.children[i] as ElementNode;
            if (prevCell && prevCell.attributes && prevCell.attributes['merged'] === 'true') {
              insertPos--;
            }
          }
          
          // Insert new cell
          if (insertPos >= 0 && insertPos <= row.children.length) {
            row.children.splice(insertPos + c, 0, newCell);
          }
        }
      }
    } else if (direction === 'vertical' && colspan > 1) {
      // Split vertically (by columns)
      const row = table.children[rowIndex] as ElementNode;
      if (!row || row.type !== 'table-row') return;
      
      // Create new cells for this row
      for (let c = 1; c < colspan; c++) {
        const newCell = model.createElementNode(
          'table-cell',
          {},
          [model.createElementNode('paragraph', {}, [model.createTextNode('')])]
        );
        
        // Insert new cell
        row.children.splice(colIndex + c, 0, newCell);
      }
      
      // Update other rows if rowspan > 1
      if (rowspan > 1) {
        for (let r = rowIndex + 1; r < rowIndex + rowspan; r++) {
          const otherRow = table.children[r] as ElementNode;
          if (!otherRow || otherRow.type !== 'table-row') continue;
          
          // Create new cells for this row
          for (let c = 1; c < colspan; c++) {
            const newCell = model.createElementNode(
              'table-cell',
              { 'merged': 'true' },
              [model.createElementNode('paragraph', {}, [model.createTextNode('')])]
            );
            
            // Find position to insert
            let insertPos = colIndex;
            for (let i = 0; i < colIndex; i++) {
              const prevCell = otherRow.children[i] as ElementNode;
              if (prevCell && prevCell.attributes && prevCell.attributes['merged'] === 'true') {
                insertPos--;
              }
            }
            
            // Insert new cell
            if (insertPos >= 0 && insertPos <= otherRow.children.length) {
              otherRow.children.splice(insertPos + c, 0, newCell);
            }
          }
        }
      }
    }
    
    // Remove 'merged' attribute from all cells
    this.clearMergedAttributes(table);
  }
  
  /**
   * Insert table at range
   */
  private static insertTableAtRange(
    model: DocumentModel,
    table: ElementNode,
    range: DocumentRange
  ): void {
    // Get document root
    const root = model.getDocument();
    if (!root) return;
    
    // Simple implementation - insert at end of document
    // In a real implementation, this would use the range to determine insertion point
    root.children.push(table);
  }
  
  /**
   * Find node by path
   */
  private static findNodeByPath(
    model: DocumentModel,
    path: number[]
  ): ElementNode | null {
    // Get document root
    const root = model.getDocument();
    if (!root) return null;
    
    let current: ElementNode = root;
    
    // Follow path to find node
    for (let i = 0; i < path.length; i++) {
      const index = path[i];
      
      if (index < 0 || index >= current.children.length) {
        return null;
      }
      
      const child = current.children[index];
      if (!('children' in child)) {
        return null;
      }
      
      current = child as ElementNode;
    }
    
    return current;
  }
  
  /**
   * Get cell at specified row and column
   */
  private static getCellAt(
    table: ElementNode,
    rowIndex: number,
    colIndex: number
  ): ElementNode | null {
    if (rowIndex < 0 || rowIndex >= table.children.length) {
      return null;
    }
    
    const row = table.children[rowIndex] as ElementNode;
    if (row.type !== 'table-row') {
      return null;
    }
    
    if (colIndex < 0 || colIndex >= row.children.length) {
      return null;
    }
    
    const cell = row.children[colIndex] as ElementNode;
    if (cell.type !== 'table-cell') {
      return null;
    }
    
    return cell;
  }
  
  /**
   * Clear 'merged' attributes from all cells
   */
  private static clearMergedAttributes(table: ElementNode): void {
    table.children.forEach(row => {
      if (row.type !== 'table-row') return;
      
      row.children.forEach(cell => {
        if (cell.type !== 'table-cell' || !cell.attributes) return;
        
        delete cell.attributes['merged'];
      });
    });
  }
}