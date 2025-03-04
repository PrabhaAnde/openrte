import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { TextFormattingOperations } from '../../model/operations/text-formatting';

/**
 * Model adapter for the Highlight plugin
 */
export class HighlightModelAdapter implements PluginModelAdapter {
  /**
   * Apply highlight formatting to the document model
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange,
    params?: { color: string }
  ): void {
    const color = params?.color || 'yellow';
    
    if (color === 'transparent') {
      // Remove background if set to transparent
      TextFormattingOperations.removeMark(model, range, 'background');
    } else {
      // Apply or update background color
      TextFormattingOperations.applyMark(model, range, 'background', color);
    }
  }
  
  /**
   * Check if the selection has highlight formatting and return the color
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): { hasHighlight: boolean; color?: string } {
    // Get text nodes in range
    const textNodes = this.getTextNodesInRange(model, range);
    
    // Check for background mark
    for (const node of textNodes) {
      if (node.marks) {
        const backgroundMark = node.marks.find((mark: { type: string }) => mark.type === 'background');
        if (backgroundMark) {
          return { hasHighlight: true, color: backgroundMark.value };
        }
      }
    }
    
    return { hasHighlight: false };
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