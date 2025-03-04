import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { TextFormattingOperations } from '../../model/operations/text-formatting';

/**
 * Model adapter for the Strikethrough plugin
 */
export class StrikethroughModelAdapter implements PluginModelAdapter {
  /**
   * Apply strikethrough formatting to the document model
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange
  ): void {
    TextFormattingOperations.toggleMark(model, range, 'strikethrough');
  }
  
  /**
   * Check if the selection has strikethrough formatting
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): boolean {
    return TextFormattingOperations.hasMarkInRange(model, range, 'strikethrough');
  }
}