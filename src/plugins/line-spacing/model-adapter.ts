import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { BlockOperations } from '../../model/operations/block-operations';

/**
 * Model adapter for the LineSpacing plugin
 */
export class LineSpacingModelAdapter implements PluginModelAdapter {
  /**
   * Apply line spacing to the document model
   * 
   * @param model Document model
   * @param range Document range to apply line spacing to
   * @param params Parameters containing the line spacing value
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange,
    params?: { spacing: string }
  ): void {
    if (!params || !params.spacing) return;
    
    BlockOperations.applyLineSpacing(model, range, params.spacing);
  }
  
  /**
   * Get the current line spacing from the document model
   * 
   * @param model Document model
   * @param range Document range to check
   * @returns The current line spacing or null if not set
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): { spacing: string | null } {
    // Get blocks in range
    const blocks = BlockOperations.getBlocksInRange(model, range);
    
    if (blocks.length === 0) {
      return { spacing: null };
    }
    
    // Check if all blocks have the same line spacing
    const firstBlock = blocks[0];
    const lineSpacing = firstBlock.attributes?.['line-spacing'] || null;
    
    // Check if all blocks have the same line spacing
    const allSame = blocks.every(block => 
      (block.attributes?.['line-spacing'] || null) === lineSpacing
    );
    
    return { spacing: allSame ? lineSpacing : null };
  }
}