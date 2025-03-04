import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { TextFormattingOperations } from '../../model/operations/text-formatting';

/**
 * Model adapter for the Italic plugin
 */
export class ItalicModelAdapter implements PluginModelAdapter {
  /**
   * Apply italic formatting to the document model
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange
  ): void {
    TextFormattingOperations.toggleMark(model, range, 'italic');
  }
  
  /**
   * Check if the selection has italic formatting
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): boolean {
    return TextFormattingOperations.hasMarkInRange(model, range, 'italic');
  }
}