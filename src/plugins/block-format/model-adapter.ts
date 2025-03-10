import { PluginModelAdapter } from '../../model/plugin-model-adapter';
import { DocumentModel } from '../../model/document-model';
import { DocumentRange } from '../../model/selection-interfaces';
import { BlockOperations } from '../../model/operations/block-operations';
import { ElementNode, NodeType } from '../../model/interfaces';

export class BlockFormatModelAdapter implements PluginModelAdapter {
  applyToModel(
    model: DocumentModel,
    range: DocumentRange,
    params: { format: string; level?: number }
  ): void {
    let blockType: 'paragraph' | 'heading' | 'blockquote' = 'paragraph';
    
    // Extract level for headings
    if (params.format.startsWith('h') && params.format.length === 2) {
      blockType = 'heading';
      const level = parseInt(params.format.substring(1), 10);
      params.level = level;
    } else if (params.format === 'blockquote') {
      blockType = 'blockquote'; // Treat blockquote as its own block type
    }

    // Get affected blocks
    const blocks = BlockOperations.getBlocksInRange(model, range);
    
    if (blocks.length === 0) {
      console.warn('No blocks found in range for format application');
      return;
    }

    // Convert each block to the target format
    blocks.forEach(block => {
      const attributes = { ...(block.attributes || {}) };
      
      // Set heading level if applicable
      if (blockType === 'heading' && params.level) {
        attributes['level'] = params.level.toString();
      }
      
      // Create new block with the target type
      const newBlock: ElementNode = {
        type: blockType as NodeType,
        id: block.id,
        attributes,
        children: [...block.children]
      };
      
      // Replace the old block with the new one
      BlockOperations.replaceBlock(model, block, newBlock);
    });  }

    getStateFromModel(
      model: DocumentModel,
      range: DocumentRange
    ): { format: string; level?: number } | null {
      if (!range || !range.start) {
        return null;
      }
      
      const blocks = BlockOperations.getBlocksInRange(model, range);
      if (blocks.length === 0) {
        return null;
      }
      
      const block = blocks[0];
      console.log("Current block type:", block.type);
      
      if (block.type === 'heading') {
        const level = block.attributes?.level ? parseInt(block.attributes.level, 10) : 1;
        return { format: `h${level}`, level };
      } else if (block.type === 'blockquote') {
        return { format: 'blockquote' };
      } else if (block.type === 'paragraph') {
        return { format: 'p' };
      }
      
      return { format: 'p' };
    }
    

}