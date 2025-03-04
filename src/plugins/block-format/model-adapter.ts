import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { BlockOperations } from '../../model/operations/block-operations';
import { ElementNode } from '../../model/interfaces';

/**
 * Model adapter for the Block Format plugin
 */
export class BlockFormatModelAdapter implements PluginModelAdapter {
  /**
   * Apply block format to the document model
   * 
   * @param model Document model
   * @param range Document range to apply formatting to
   * @param params Format parameters
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange,
    params: { format: string; level?: number }
  ): void {
    // Convert format string to block type
    let blockType: 'paragraph' | 'heading' = 'paragraph';
    
    if (params.format === 'p') {
      blockType = 'paragraph';
    } else if (params.format.startsWith('h') && params.format.length === 2) {
      blockType = 'heading';
      // Extract heading level from format (h1, h2, etc.)
      const level = parseInt(params.format.substring(1), 10);
      params.level = level;
    } else if (params.format === 'blockquote') {
      // For blockquote, we'll use paragraph with a special attribute
      blockType = 'paragraph';
      
      // Get blocks in range
      const blocks = BlockOperations.getBlocksInRange(model, range);
      
      // Apply blockquote attribute
      blocks.forEach(block => {
        if (!block.attributes) {
          block.attributes = {};
        }
        block.attributes['blockquote'] = 'true';
      });
      
      return;
    }
    
    // Apply block format
    BlockOperations.convertBlocks(
      model, 
      range, 
      blockType, 
      { level: params.level }
    );
  }
  
  /**
   * Get current block format from model
   * 
   * @param model Document model
   * @param range Current selection range
   * @returns Format information or null if no format detected
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): { format: string; level?: number } | null {
    if (!range || !range.start) {
      return null;
    }
    
    // Get blocks in range
    const blocks = BlockOperations.getBlocksInRange(model, range);
    
    if (blocks.length === 0) {
      return null;
    }
    
    // Use the first block to determine format
    const block = blocks[0];
    
    // Determine format based on block type and attributes
    if (block.type === 'heading') {
      const level = block.attributes?.level ? parseInt(block.attributes.level, 10) : 1;
      return { format: `h${level}`, level };
    } else if (block.type === 'paragraph') {
      // Check for blockquote
      if (block.attributes?.blockquote === 'true') {
        return { format: 'blockquote' };
      }
      return { format: 'p' };
    }
    
    // Default to paragraph if no specific format detected
    return { format: 'p' };
  }
}