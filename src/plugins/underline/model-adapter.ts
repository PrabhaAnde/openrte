import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { TextFormattingOperations } from '../../model/operations/text-formatting';

/**
 * Model adapter for the Underline plugin
 */
export class UnderlineModelAdapter implements PluginModelAdapter {
  /**
   * Apply underline formatting to the document model
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange
  ): void {
    TextFormattingOperations.toggleMark(model, range, 'underline');
  }
  
  /**
   * Check if the selection has underline formatting
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): boolean {
    return TextFormattingOperations.hasMarkInRange(model, range, 'underline');
  }
}