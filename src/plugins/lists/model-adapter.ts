import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { ListOperations } from '../../model/operations/list-operations';

export class ListsModelAdapter implements PluginModelAdapter {
  /**
   * Apply list operation to the document model
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange,
    params: { action: string; listType?: 'bullet' | 'ordered' }
  ): void {
    switch (params.action) {
      case 'createList':
        ListOperations.createList(model, range, params.listType || 'bullet');
        break;
      case 'removeList':
        ListOperations.listToBlocks(model, range);
        break;
      case 'changeType':
        ListOperations.changeListType(model, range, params.listType || 'bullet');
        break;
      case 'increaseIndent':
        ListOperations.increaseListIndent(model, range);
        break;
      case 'decreaseIndent':
        ListOperations.decreaseListIndent(model, range);
        break;
    }
  }
  
  /**
   * Get current list state from model
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): { inList: boolean; listType?: 'bullet' | 'ordered' } {
    // Get all lists in the document
    const lists = model.getNodesByType('list');
    
    // Check if any list contains the current selection
    // This is a simplified implementation - in a real editor, 
    // you would need to check if the selection is within a list item
    if (lists.length > 0) {
      // For simplicity, we'll just check the first list's type
      const firstList = lists[0];
      if ('attributes' in firstList && firstList.attributes) {
        const listType = firstList.attributes['list-type'] as 'bullet' | 'ordered';
        return { inList: true, listType };
      }
      return { inList: true };
    }
    
    return { inList: false };
  }
}