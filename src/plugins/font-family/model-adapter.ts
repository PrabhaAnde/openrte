import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { TextFormattingOperations } from '../../model/operations/text-formatting';

export class FontFamilyModelAdapter implements PluginModelAdapter {
  applyToModel(
    model: DocumentModel,
    range: DocumentRange,
    params?: { fontFamily: string }
  ): void {
    if (!params || !params.fontFamily) return;
    
    // If we're removing the font family, remove the mark
    if (params.fontFamily === '') {
      TextFormattingOperations.removeMark(model, range, 'fontFamily');
    } else {
      // Otherwise apply the font family mark
      TextFormattingOperations.applyMark(model, range, 'fontFamily', params.fontFamily);
    }
  }

  getStateFromModel(
    model: DocumentModel,
    range: DocumentRange
  ): { fontFamily: string | null } {
    if (!range) return { fontFamily: null };
    
    // Check if there's a font family mark in the range
    const hasFont = TextFormattingOperations.hasMarkInRange(model, range, 'fontFamily');
    
    if (!hasFont) {
      return { fontFamily: null };
    }

    // Find the text nodes in the range
    const textNodes = this.getTextNodesInRange(model, range);
    
    // Look for font family marks
    for (const node of textNodes) {
      if (node.marks) {
        const fontMark = node.marks.find((mark: { type: string }) => mark.type === 'fontFamily');
        if (fontMark && fontMark.value) {
          return { fontFamily: fontMark.value };
        }
      }
    }
    
    return { fontFamily: null };
  }

  private getTextNodesInRange(
    model: DocumentModel,
    range: DocumentRange
  ): any[] {
    if (!range) return [];
    return model.getNodesByType('text');
  }
}