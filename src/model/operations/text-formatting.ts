import { DocumentModel } from '../document-model';
import { DocumentRange } from '../selection-interfaces';
import { TextNode, Mark, ElementNode,DocumentNode } from '../interfaces';

/**
 * Operations for text formatting in the document model
 */
export class TextFormattingOperations {
  /**
   * Apply a mark to text in a range
   */
  static applyMark(
    model: DocumentModel,
    range: DocumentRange,
    markType: string,
    markValue?: string
  ): void {
    // Handle case when selection is on a single text node
    if (range.start.node.id === range.end.node.id && range.start.node.type === 'text') {
      const textNode = range.start.node as TextNode;
      const startOffset = range.start.offset;
      const endOffset = range.end.offset;
  
      console.log(`Applying ${markType} to text node ${textNode.id} from ${startOffset} to ${endOffset}`);
      
      // If the entire node is selected, simply add the mark
      if (startOffset === 0 && endOffset === textNode.text.length) {
        this.applyMarkToWholeNode(textNode, markType, markValue);
        return;
      }
      
      // Otherwise we need to split the node into parts
      this.applyMarkToTextNodePortion(model, textNode, startOffset, endOffset, markType, markValue);
      return;
    }
    
    // For selections spanning multiple nodes
    console.log("Multi-node selection");
    const textNodes = this.findExactNodesInRange(model, range);
    console.log(`Found ${textNodes.length} text nodes in range`);
    
    // Process each node based on whether it's partially or fully selected
    textNodes.forEach(node => {
      this.applyMarkToWholeNode(node, markType, markValue);
    });
  }
  
  // Helper to apply mark to an entire node
  private static applyMarkToWholeNode(textNode: TextNode, markType: string, markValue?: string): void {
    const marks = textNode.marks || [];
    const existingMarkIndex = marks.findIndex(m => m.type === markType);
    
    if (existingMarkIndex === -1) {
      // Add new mark
      marks.push({
        type: markType as Mark['type'],
        value: markValue
      });
    } else if (markValue !== undefined) {
      // Update existing mark
      marks[existingMarkIndex].value = markValue;
    }
    
    textNode.marks = marks;
    console.log(`Applied ${markType} to entire node ${textNode.id}`);
  }
  
  // Helper to apply mark to part of a text node
  private static applyMarkToTextNodePortion(
    model: DocumentModel,
    node: TextNode,
    startOffset: number, 
    endOffset: number,
    markType: string,
    markValue?: string
  ): void {
    // Create three segments: before, marked, and after
    const beforeText = node.text.substring(0, startOffset);
    const markedText = node.text.substring(startOffset, endOffset);
    const afterText = node.text.substring(endOffset);
    
    const newNodes: TextNode[] = [];
    
    // Create the segments
    if (beforeText) {
      newNodes.push(model.createTextNode(beforeText, node.marks));
    }
    
    if (markedText) {
      const markedNode = model.createTextNode(markedText, [...(node.marks || [])]);
      this.applyMarkToWholeNode(markedNode, markType, markValue);
      newNodes.push(markedNode);
    }
    
    if (afterText) {
      newNodes.push(model.createTextNode(afterText, node.marks));
    }
    
    // Replace the original node with these new segments
    this.replaceNodeWithNodes(model, node, newNodes);
    console.log(`Split node ${node.id} into ${newNodes.length} parts`);
  }
  
  // Helper to replace a node with new nodes
  private static replaceNodeWithNodes(model: DocumentModel, oldNode: TextNode, newNodes: TextNode[]): void {
    const document = model.getDocument();
    this.replaceNodeInParent(document, oldNode.id, newNodes);
  }
  
  // Helper to find a node in the document and replace it
  private static replaceNodeInParent(node: DocumentNode, nodeId: string, replacementNodes: DocumentNode[]): boolean {
    if (node.type === 'text') {
      return false;
    }
    
    const elementNode = node as ElementNode;
    const index = elementNode.children.findIndex(child => child.id === nodeId);
    
    if (index !== -1) {
      // Found the node, replace it
      elementNode.children.splice(index, 1, ...replacementNodes);
      return true;
    }
    
    // Recursively search in children
    for (const child of elementNode.children) {
      if (child.type !== 'text') {
        if (this.replaceNodeInParent(child, nodeId, replacementNodes)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Improved method to get exactly the nodes in a range
  private static findExactNodesInRange(model: DocumentModel, range: DocumentRange): TextNode[] {
    // For single node selections
    if (range.start.node.id === range.end.node.id) {
      if (range.start.node.type === 'text') {
        return [range.start.node as TextNode];
      }
      return [];
    }
    
    // For multi-node selections, traverse the DOM tree
    const allTextNodes = this.collectTextNodes(model.getDocument());
    const result: TextNode[] = [];
    let inRange = false;
    
    for (const node of allTextNodes) {
      if (node.id === range.start.node.id) {
        inRange = true;
        result.push(node);
        continue;
      }
      
      if (inRange) {
        result.push(node);
      }
      
      if (node.id === range.end.node.id) {
        inRange = false;
      }
    }
    
    return result;
  }
  
  // Completely rewritten toggle method
  static toggleMark(
    model: DocumentModel,
    range: DocumentRange,
    markType: string,
    markValue?: string
  ): void {
    // Check if selection is collapsed
    if (!range || (range.start.node.id === range.end.node.id && range.start.offset === range.end.offset)) {
      console.log("Cannot toggle mark on collapsed selection");
      return;
    }
    
    console.log(`Toggling mark ${markType} in range`);
    
    // Determine if mark exists in the range
    const hasMarkInRange = this.hasMarkInRange(model, range, markType);
    console.log(`Mark ${markType} exists in range: ${hasMarkInRange}`);
    
    if (hasMarkInRange) {
      this.removeMark(model, range, markType);
    } else {
      this.applyMark(model, range, markType, markValue);
    }
  }
  
  // Improved removal of marks
  static removeMark(
    model: DocumentModel,
    range: DocumentRange,
    markType: string
  ): void {
    console.log(`Removing mark ${markType} from range`);
    
    // For single node selections
    if (range.start.node.id === range.end.node.id && range.start.node.type === 'text') {
      const textNode = range.start.node as TextNode;
      const startOffset = range.start.offset;
      const endOffset = range.end.offset;
      
      // If selection covers the entire node
      if (startOffset === 0 && endOffset === textNode.text.length) {
        this.removeMarkFromNode(textNode, markType);
        return;
      }
      
      // For partial selections, split the node
      this.removeMarkFromTextNodePortion(model, textNode, startOffset, endOffset, markType);
      return;
    }
    
    // For multi-node selections
    const textNodes = this.findExactNodesInRange(model, range);
    textNodes.forEach(node => {
      this.removeMarkFromNode(node, markType);
    });
  }
  
  // Helper to remove mark from a node
  private static removeMarkFromNode(node: TextNode, markType: string): void {
    if (!node.marks) return;
    
    node.marks = node.marks.filter(mark => mark.type !== markType);
    
    if (node.marks.length === 0) {
      delete node.marks;
    }
    
    console.log(`Removed ${markType} from node ${node.id}`);
  }
  
  // Helper to remove mark from part of a text node
  private static removeMarkFromTextNodePortion(
    model: DocumentModel,
    node: TextNode,
    startOffset: number,
    endOffset: number,
    markType: string
  ): void {
    // Similar to apply but removing the mark
    const beforeText = node.text.substring(0, startOffset);
    const middleText = node.text.substring(startOffset, endOffset);
    const afterText = node.text.substring(endOffset);
    
    const newNodes: TextNode[] = [];
    
    // Create segments
    if (beforeText) {
      newNodes.push(model.createTextNode(beforeText, node.marks));
    }
    
    if (middleText) {
      // Create middle node without the specified mark
      const middleMarks = node.marks ? 
        node.marks.filter(mark => mark.type !== markType) : 
        undefined;
      
      newNodes.push(model.createTextNode(middleText, middleMarks?.length ? middleMarks : undefined));
    }
    
    if (afterText) {
      newNodes.push(model.createTextNode(afterText, node.marks));
    }
    
    // Replace the node with these segments
    this.replaceNodeWithNodes(model, node, newNodes);
  }
  
  // Add this helper method to TextFormattingOperations
  private static replaceTextNodeInParent(model: DocumentModel, oldNode: TextNode, newNodes: TextNode[]): void {
    // Find the parent node
    const document = model.getDocument();
    const findParentResult = this.findParentWithChild(document, oldNode.id);
    
    if (findParentResult) {
      const { parent, childIndex } = findParentResult;
      // Replace the old node with the new nodes
      parent.children.splice(childIndex, 1, ...newNodes);
      console.log(`Replaced node ${oldNode.id} with ${newNodes.length} new nodes in parent ${parent.id}`);
    } else {
      console.error(`Could not find parent for node ${oldNode.id}`);
    }
  }
  
  // Add this helper method to TextFormattingOperations
  private static findParentWithChild(node: DocumentNode, childId: string): { parent: ElementNode, childIndex: number } | null {
    if (node.type === 'text') {
      return null;
    }
    
    const elementNode = node as ElementNode;
    const childIndex = elementNode.children.findIndex(child => child.id === childId);
    
    if (childIndex !== -1) {
      return { parent: elementNode, childIndex };
    }
    
    for (const child of elementNode.children) {
      if (child.type !== 'text') {
        const result = this.findParentWithChild(child, childId);
        if (result) {
          return result;
        }
      }
    }
    
    return null;
  }
  
  
  
  /**
   * Check if a mark exists in a range
   */
  static hasMarkInRange(
    model: DocumentModel,
    range: DocumentRange,
    markType: string
  ): boolean {
    // Get the text nodes in the range
    const textNodes = this.findExactNodesInRange(model, range);
    
    // Single node case with partial selection
    if (textNodes.length === 1 && range.start.node.id === range.end.node.id) {
      const node = textNodes[0];
      
      // If it has the mark, consider it marked
      if (node.marks && node.marks.some(mark => mark.type === markType)) {
        return true;
      }
      
      return false;
    }
    
    // For multiple nodes, check if ANY node has the mark
    for (const node of textNodes) {
      if (node.marks && node.marks.some(mark => mark.type === markType)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get all text nodes in a range
   * Improved implementation that uses range information
   */
  private static getTextNodesInRange(
    model: DocumentModel,
    range: DocumentRange
  ): TextNode[] {
    if (!range || !range.start || !range.end) {
      return [];
    }
    
    const startNodeId = range.start.node.id;
    const endNodeId = range.end.node.id;
    
    // Same node case - the simplest scenario
    if (startNodeId === endNodeId && range.start.node.type === 'text') {
      // If it's the same text node, just return that one node
      console.log("Single text node selection");
      return [range.start.node as TextNode];
    }
    
    // Get all text nodes in the document for reference
    const allTextNodes = this.collectTextNodes(model.getDocument());
    
    // Try to find nodes from start to end
    let inRange = false;
    const result: TextNode[] = [];
    
    // First attempt: Look for nodes between start and end nodes (inclusive)
    for (const node of allTextNodes) {
      if (node.id === startNodeId) {
        inRange = true;
      }
      
      if (inRange) {
        result.push(node);
      }
      
      if (node.id === endNodeId) {
        inRange = false;
      }
    }
    
    // If no nodes found, try reversing the direction (sometimes selection is backwards)
    if (result.length === 0) {
      inRange = false;
      for (const node of allTextNodes) {
        if (node.id === endNodeId) {
          inRange = true;
        }
        
        if (inRange) {
          result.push(node);
        }
        
        if (node.id === startNodeId) {
          inRange = false;
        }
      }
    }
    
    // If still no nodes found, try using common ancestor approach
    if (result.length === 0) {
      const startParents = this.getParentChain(range.start.node);
      const endParents = this.getParentChain(range.end.node);
      
      // Find common ancestor
      let commonAncestor = null;
      for (const parent of startParents) {
        if (endParents.includes(parent)) {
          commonAncestor = parent;
          break;
        }
      }
      
      // If we found a common ancestor, get all text nodes within it
      if (commonAncestor) {
        const allNodesInAncestor = this.collectTextNodes(commonAncestor);
        
        // For large common ancestors, we need to be more selective
        // Try to identify only the relevant text nodes based on position
        if (allNodesInAncestor.length > 5) {
          console.log("Large common ancestor with many text nodes, being selective");
          
          // Find the position of the start and end nodes in the array
          const startIndex = allNodesInAncestor.findIndex(node => node.id === startNodeId);
          const endIndex = allNodesInAncestor.findIndex(node => node.id === endNodeId);
          
          if (startIndex !== -1 && endIndex !== -1) {
            // Use only the slice between start and end
            const slice = allNodesInAncestor.slice(
              Math.min(startIndex, endIndex),
              Math.max(startIndex, endIndex) + 1
            );
            return slice;
          }
        }
        
        return allNodesInAncestor;
      }
    }
    
    // Debug output
    console.log(`Found ${result.length} text nodes in range from ${startNodeId} to ${endNodeId}`);
    
    return result;
  }
  
  // Add this helper method to the TextFormattingOperations class
  private static isParentOf(potentialParent: DocumentNode, potentialChild: DocumentNode): boolean {
    // Implementation of parent-child relationship check
    if (potentialParent.type === 'text' || !('children' in potentialParent)) {
      return false;
    }
    
    const parentElement = potentialParent as ElementNode;
    
    // Direct child check
    if (parentElement.children.some(child => child.id === potentialChild.id)) {
      return true;
    }
    
    // Recursive check for descendants
    return parentElement.children.some(child => 
      'children' in child && this.isParentOf(child as ElementNode, potentialChild)
    );
  }
  
  /**
   * Get the chain of parent nodes for a node
   */
  private static getParentChain(node: DocumentNode): DocumentNode[] {
    const result: DocumentNode[] = [node];
    
    // This would require keeping parent references in the model
    // which is not implemented here
    
    return result;
  }
  
  /**
   * Collect all text nodes in a document node
   */
  private static collectTextNodes(node: any): TextNode[] {
    if (node.type === 'text') {
      return [node as TextNode];
    }
    
    const result: TextNode[] = [];
    
    if ('children' in node) {
      const elementNode = node as ElementNode;
      elementNode.children.forEach(child => {
        result.push(...this.collectTextNodes(child));
      });
    }
    
    return result;
  }
  
  /**
   * Split a text node at a specific offset
   */
  static splitTextNode(
    model: DocumentModel,
    node: TextNode,
    offset: number
  ): [TextNode, TextNode] {
    if (offset <= 0 || offset >= node.text.length) {
      return [node, node]; // No need to split
    }
    
    // Create two new text nodes
    const leftText = node.text.substring(0, offset);
    const rightText = node.text.substring(offset);
    
    const leftNode = model.createTextNode(leftText, node.marks);
    const rightNode = model.createTextNode(rightText, node.marks);
    
    return [leftNode, rightNode];
  }
  
  /**
   * Apply a mark to a specific portion of a text node
   */
  static applyMarkToTextNodeRange(
    model: DocumentModel,
    node: TextNode,
    start: number,
    end: number,
    markType: string,
    markValue?: string
  ): TextNode[] {
    // Ensure valid range
    start = Math.max(0, start);
    end = Math.min(node.text.length, end);
    
    if (start >= end) {
      return [node]; // Nothing to do
    }
    
    // If the range covers the entire node, apply the mark directly
    if (start === 0 && end === node.text.length) {
      const marks = node.marks || [];
      const existingMarkIndex = marks.findIndex(m => m.type === markType);
      
      if (existingMarkIndex === -1) {
        marks.push({
          type: markType as Mark['type'],
          value: markValue
        });
      } else if (markValue !== undefined) {
        marks[existingMarkIndex].value = markValue;
      }
      
      node.marks = marks;
      return [node];
    }
    
    // Otherwise, split the node and apply the mark to the middle part
    const result: TextNode[] = [];
    
    // Split at the start if needed
    if (start > 0) {
      const [left, right] = this.splitTextNode(model, node, start);
      result.push(left);
      
      // Apply mark to the right part up to end - start
      const rightMarks = right.marks || [];
      const existingMarkIndex = rightMarks.findIndex(m => m.type === markType);
      
      if (existingMarkIndex === -1) {
        rightMarks.push({
          type: markType as Mark['type'],
          value: markValue
        });
      } else if (markValue !== undefined) {
        rightMarks[existingMarkIndex].value = markValue;
      }
      
      right.marks = rightMarks;
      
      // Split the right part if needed
      if (end < node.text.length) {
        const [middle, far] = this.splitTextNode(model, right, end - start);
        result.push(middle);
        result.push(far);
      } else {
        result.push(right);
      }
    } else {
      // Start is 0, so split at end
      const [left, right] = this.splitTextNode(model, node, end);
      
      // Apply mark to the left part
      const leftMarks = left.marks || [];
      const existingMarkIndex = leftMarks.findIndex(m => m.type === markType);
      
      if (existingMarkIndex === -1) {
        leftMarks.push({
          type: markType as Mark['type'],
          value: markValue
        });
      } else if (markValue !== undefined) {
        leftMarks[existingMarkIndex].value = markValue;
      }
      
      left.marks = leftMarks;
      
      result.push(left);
      result.push(right);
    }
    
    return result;
  }
}