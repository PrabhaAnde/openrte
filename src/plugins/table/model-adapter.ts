import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { TableOperations } from '../../model/operations/table-operations';
import { ElementNode } from '../../model/interfaces';

export class TableModelAdapter implements PluginModelAdapter {
  /**
   * Apply table operations to the document model
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange,
    params: { 
      action: string;
      rows?: number;
      columns?: number;
      rowIndex?: number;
      columnIndex?: number;
      tablePath?: number[];
      startRow?: number;
      startCol?: number;
      endRow?: number;
      endCol?: number;
      direction?: 'horizontal' | 'vertical';
    }
  ): void {
    switch (params.action) {
      case 'createTable':
        TableOperations.createTable(
          model, 
          range, 
          params.rows || 2, 
          params.columns || 2
        );
        break;
      case 'insertRow':
        if (params.tablePath && params.rowIndex !== undefined) {
          TableOperations.insertRow(model, params.tablePath, params.rowIndex);
        }
        break;
      case 'insertColumn':
        if (params.tablePath && params.columnIndex !== undefined) {
          TableOperations.insertColumn(model, params.tablePath, params.columnIndex);
        }
        break;
      case 'deleteRow':
        if (params.tablePath && params.rowIndex !== undefined) {
          TableOperations.deleteRow(model, params.tablePath, params.rowIndex);
        }
        break;
      case 'deleteColumn':
        if (params.tablePath && params.columnIndex !== undefined) {
          TableOperations.deleteColumn(model, params.tablePath, params.columnIndex);
        }
        break;
      case 'mergeCells':
        if (params.tablePath && 
            params.startRow !== undefined && 
            params.startCol !== undefined &&
            params.endRow !== undefined &&
            params.endCol !== undefined) {
          TableOperations.mergeCells(
            model, 
            params.tablePath, 
            params.startRow, 
            params.startCol, 
            params.endRow, 
            params.endCol
          );
        }
        break;
      case 'splitCell':
        if (params.tablePath && 
            params.rowIndex !== undefined && 
            params.columnIndex !== undefined &&
            params.direction) {
          TableOperations.splitCell(
            model, 
            params.tablePath, 
            params.rowIndex, 
            params.columnIndex, 
            params.direction
          );
        }
        break;
    }
  }
  
  /**
   * Get current table context
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): { inTable: boolean; tablePath?: number[] } {
    // Get all tables in the document
    const tables = model.getNodesByType('table');
    
    // Check if any table contains the current selection
    // This is a simplified implementation - in a real editor, 
    // you would need to check if the selection is within a table cell
    if (tables.length > 0) {
      // For simplicity, we'll just return the path to the first table
      // In a real implementation, you would determine which table contains the selection
      return { 
        inTable: true, 
        tablePath: this.findNodePath(model, tables[0] as ElementNode) 
      };
    }
    
    return { inTable: false };
  }
  
  /**
   * Find the path to a node in the document
   */
  private findNodePath(
    model: DocumentModel,
    targetNode: ElementNode
  ): number[] {
    const path: number[] = [];
    const root = model.getDocument();
    
    // Helper function to recursively find the path
    const findPath = (
      node: ElementNode,
      target: ElementNode,
      currentPath: number[]
    ): boolean => {
      if (node === target) {
        return true;
      }
      
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if ('children' in child) {
          currentPath.push(i);
          if (findPath(child as ElementNode, target, currentPath)) {
            return true;
          }
          currentPath.pop();
        }
      }
      
      return false;
    };
    
    findPath(root, targetNode, path);
    return path;
  }
}