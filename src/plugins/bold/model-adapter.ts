import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { TextFormattingOperations } from '../../model/operations/text-formatting';

/**
 * Model adapter for the Bold plugin
 */
export class BoldModelAdapter implements PluginModelAdapter {
  /**
   * Apply bold formatting to the document model
   * 
   * @param model Document model
   * @param range Document range to apply formatting to
   */
  applyToModel(
    model: DocumentModel,
    range: DocumentRange
  ): void {
    TextFormattingOperations.toggleMark(model, range, 'bold');
  }
  
  /**
   * Check if the selection has bold formatting
   * 
   * @param model Document model
   * @param range Document range to check
   * @returns True if the selection has bold formatting
   */
  getStateFromModel(
    model: DocumentModel,
    range: DocumentRange
  ): boolean {
    return TextFormattingOperations.hasMarkInRange(model, range, 'bold');
  }
}