import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { BlockOperations } from '../../model/operations/block-operations';

/**
 * Model adapter for the Indentation plugin
 */
export class IndentationModelAdapter implements PluginModelAdapter {
  /**
   * Apply indentation to the document model
   * 
   * @param model Document model
   * @param range Document range to apply indentation to
   * @param params Parameters containing the indentation direction
   */
  applyToModel(
    model: DocumentModel, 
    range: DocumentRange,
    params?: { increase: boolean }
  ): void {
    if (!params) return;
    
    BlockOperations.applyIndentation(model, range, params.increase);
  }
  
  /**
   * Get the current indentation level from the document model
   * 
   * @param model Document model
   * @param range Document range to check
   * @returns The current indentation state
   */
  getStateFromModel(
    model: DocumentModel, 
    range: DocumentRange
  ): { indentLevel: number | null } {
    // Get blocks in range
    const blocks = BlockOperations.getBlocksInRange(model, range);
    
    if (blocks.length === 0) {
      return { indentLevel: null };
    }
    
    // Check if all blocks have the same indentation level
    const firstBlock = blocks[0];
    const indentLevel = firstBlock.attributes?.['indent'] 
      ? parseInt(firstBlock.attributes['indent'], 10) 
      : 0;
    
    // Check if all blocks have the same indentation level
    const allSame = blocks.every(block => {
      const blockIndent = block.attributes?.['indent'] 
        ? parseInt(block.attributes['indent'], 10) 
        : 0;
      return blockIndent === indentLevel;
    });
    
    return { indentLevel: allSame ? indentLevel : null };
  }
}