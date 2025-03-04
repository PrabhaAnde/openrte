import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { TextFormattingOperations } from '../../model/operations/text-formatting';

/**
 * Model adapter for the TextColor plugin
 */
export class TextColorModelAdapter implements PluginModelAdapter {
  /**
   * Apply text color formatting to the document model
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange,
    params?: { color: string }
  ): void {
    const color = params?.color || 'currentColor';
    
    if (color === 'currentColor') {
      // Remove color if set to default
      TextFormattingOperations.removeMark(model, range, 'color');
    } else {
      // Apply or update color
      TextFormattingOperations.applyMark(model, range, 'color', color);
    }
  }
  
  /**
   * Check if the selection has text color formatting and return the color
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): { hasColor: boolean; color?: string } {
    // Get text nodes in range
    const textNodes = this.getTextNodesInRange(model, range);
    
    // Check for color mark
    for (const node of textNodes) {
      if (node.marks) {
        const colorMark = node.marks.find((mark: { type: string }) => mark.type === 'color');
        if (colorMark) {
          return { hasColor: true, color: colorMark.value };
        }
      }
    }
    
    return { hasColor: false };
  }
  
  /**
   * Get all text nodes in a range
   * Helper method for this adapter (simplified)
   */
  private getTextNodesInRange(
    model: DocumentModel,
    range: DocumentRange
  ): any[] {
    if (!range) return [];
    
    // Simplified approach, just using the text formatting operations
    return model.getNodesByType('text');
  }
}