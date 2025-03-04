import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { BlockOperations } from '../../model/operations/block-operations';

/**
 * Model adapter for the Alignment plugin
 */
export class AlignmentModelAdapter implements PluginModelAdapter {
  /**
   * Apply alignment to the document model
   * 
   * @param model Document model
   * @param range Document range to apply alignment to
   * @param params Alignment parameters
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange,
    params: { alignment: 'left' | 'center' | 'right' | 'justify' }
  ): void {
    BlockOperations.applyAlignment(model, range, params.alignment);
  }
  
  /**
   * Get current alignment from model
   * 
   * @param model Document model
   * @param range Current selection range
   * @returns Alignment information or null if no alignment detected
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): { alignment: 'left' | 'center' | 'right' | 'justify' } | null {
    if (!range || !range.start) {
      return null;
    }
    
    // Get blocks in range
    const blocks = BlockOperations.getBlocksInRange(model, range);
    
    if (blocks.length === 0) {
      return null;
    }
    
    // Use the first block to determine alignment
    const block = blocks[0];
    
    // Get alignment from attributes
    const alignment = block.attributes?.align as 'left' | 'center' | 'right' | 'justify';
    
    // Default to left if no alignment specified
    return { alignment: alignment || 'left' };
  }
}