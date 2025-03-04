import { DocumentModel } from '../document-model';
import { AnyOperation, InsertTextOperation, DeleteTextOperation, ApplyMarkOperation, RemoveMarkOperation, InsertNodeOperation, RemoveNodeOperation, SetNodeOperation, MergeNodesOperation, SplitNodeOperation, MoveNodeOperation } from './operation-types';
import { DocumentNode, ElementNode, TextNode } from '../interfaces';
import { TextFormattingOperations } from './text-formatting';

/**
 * Get a node at a specific path
 */
function getNodeAtPath(model: DocumentModel, path: number[]): DocumentNode | null {
  let node: DocumentNode = model.getDocument();
  
  for (let i = 0; i < path.length; i++) {
    if (!('children' in node)) {
      return null;
    }
    
    const index = path[i];
    if (index < 0 || index >= node.children.length) {
      return null;
    }
    
    node = node.children[index];
  }
  
  return node;
}

/**
 * Get a parent node at a specific path
 */
function getParentNode(model: DocumentModel, path: number[]): ElementNode | null {
  if (path.length === 0) {
    return model.getDocument();
  }
  
  const parentPath = path.slice(0, -1);
  const parent = getNodeAtPath(model, parentPath);
  
  if (!parent || !('children' in parent)) {
    return null;
  }
  
  return parent as ElementNode;
}

/**
 * Apply an operation to a document model
 */
export function applyOperation(model: DocumentModel, operation: AnyOperation): void {
  switch (operation.type) {
    case 'insertText':
      applyInsertTextOperation(model, operation);
      break;
    case 'deleteText':
      applyDeleteTextOperation(model, operation);
      break;
    case 'applyMark':
      applyApplyMarkOperation(model, operation);
      break;
    case 'removeMark':
      applyRemoveMarkOperation(model, operation);
      break;
    case 'insertNode':
      applyInsertNodeOperation(model, operation);
      break;
    case 'removeNode':
      applyRemoveNodeOperation(model, operation);
      break;
    case 'setNode':
      applySetNodeOperation(model, operation);
      break;
    case 'mergeNodes':
      applyMergeNodesOperation(model, operation);
      break;
    case 'splitNode':
      applySplitNodeOperation(model, operation);
      break;
    case 'moveNode':
      applyMoveNodeOperation(model, operation);
      break;
    default:
      throw new Error(`Unknown operation type: ${(operation as any).type}`);
  }
}

/**
 * Apply insert text operation
 */
function applyInsertTextOperation(model: DocumentModel, operation: InsertTextOperation): void {
  const node = getNodeAtPath(model, operation.path);
  
  if (!node || node.type !== 'text') {
    throw new Error('Cannot insert text into non-text node');
  }
  
  const textNode = node as TextNode;
  const { offset, text } = operation;
  
  // Insert text at offset
  textNode.text = textNode.text.substring(0, offset) + text + textNode.text.substring(offset);
}

/**
 * Apply delete text operation
 */
function applyDeleteTextOperation(model: DocumentModel, operation: DeleteTextOperation): void {
  const node = getNodeAtPath(model, operation.path);
  
  if (!node || node.type !== 'text') {
    throw new Error('Cannot delete text from non-text node');
  }
  
  const textNode = node as TextNode;
  const { offset, count } = operation;
  
  // Store deleted text for undo if not already stored
  if (!operation.text) {
    operation.text = textNode.text.substring(offset, offset + count);
  }
  
  // Delete text at offset
  textNode.text = textNode.text.substring(0, offset) + textNode.text.substring(offset + count);
}

/**
 * Apply mark operation
 */
function applyApplyMarkOperation(model: DocumentModel, operation: ApplyMarkOperation): void {
  const node = getNodeAtPath(model, operation.path);
  
  if (!node || node.type !== 'text') {
    throw new Error('Cannot apply mark to non-text node');
  }
  
  const textNode = node as TextNode;
  const { mark, range } = operation;
  
  // If the range covers the entire node, apply mark directly
  if (range[0] === 0 && range[1] === textNode.text.length) {
    const marks = textNode.marks || [];
    const existingMarkIndex = marks.findIndex(m => m.type === mark.type);
    
    if (existingMarkIndex === -1) {
      // Ensure mark type is valid for the Mark interface
      marks.push({
        type: mark.type as any, // Cast to any to bypass type checking
        value: mark.value
      });
    } else if (mark.value !== undefined) {
      marks[existingMarkIndex].value = mark.value;
    }
    
    textNode.marks = marks;
  } else {
    // Otherwise, use the text formatting operations to apply mark to a range
    const result = TextFormattingOperations.applyMarkToTextNodeRange(
      model,
      textNode,
      range[0],
      range[1],
      mark.type,
      mark.value
    );
    
    // Replace the node with the result if needed
    if (result.length > 1) {
      const parent = getParentNode(model, operation.path);
      if (!parent) {
        throw new Error('Cannot find parent node');
      }
      
      const index = operation.path[operation.path.length - 1];
      parent.children.splice(index, 1, ...result);
    }
  }
}

/**
 * Apply remove mark operation
 */
function applyRemoveMarkOperation(model: DocumentModel, operation: RemoveMarkOperation): void {
  const node = getNodeAtPath(model, operation.path);
  
  if (!node || node.type !== 'text') {
    throw new Error('Cannot remove mark from non-text node');
  }
  
  const textNode = node as TextNode;
  
  if (!textNode.marks) return;
  
  textNode.marks = textNode.marks.filter(mark => mark.type !== operation.mark.type);
  
  // If no marks left, remove the marks array
  if (textNode.marks.length === 0) {
    delete textNode.marks;
  }
}

/**
 * Apply insert node operation
 */
function applyInsertNodeOperation(model: DocumentModel, operation: InsertNodeOperation): void {
  const parent = getParentNode(model, operation.path);
  
  if (!parent) {
    throw new Error('Cannot find parent node');
  }
  
  // Insert node at index
  parent.children.splice(operation.index, 0, operation.node);
}

/**
 * Apply remove node operation
 */
function applyRemoveNodeOperation(model: DocumentModel, operation: RemoveNodeOperation): void {
  const parent = getParentNode(model, operation.path);
  
  if (!parent) {
    throw new Error('Cannot find parent node');
  }
  
  // Store removed node for undo if not already stored
  if (!operation.node) {
    operation.node = parent.children[operation.index];
  }
  
  // Remove node at index
  parent.children.splice(operation.index, 1);
}

/**
 * Apply set node operation
 */
function applySetNodeOperation(model: DocumentModel, operation: SetNodeOperation): void {
  const node = getNodeAtPath(model, operation.path);
  
  if (!node) {
    throw new Error('Cannot find node');
  }
  
  // Store old properties for undo if not already stored
  if (!operation.oldProperties) {
    operation.oldProperties = {};
    
    for (const key in operation.properties) {
      if (key in node) {
        (operation.oldProperties as any)[key] = (node as any)[key];
      }
    }
  }
  
  // Apply new properties using type assertion to bypass type checking
  Object.keys(operation.properties).forEach(key => {
    (node as any)[key] = (operation.properties as any)[key];
  });
}

/**
 * Apply merge nodes operation
 */
function applyMergeNodesOperation(model: DocumentModel, operation: MergeNodesOperation): void {
  const parent = getParentNode(model, operation.path);
  
  if (!parent) {
    throw new Error('Cannot find parent node');
  }
  
  const index = operation.path[operation.path.length - 1];
  const node = parent.children[index];
  const nextNode = parent.children[index + 1];
  
  if (!node || !nextNode) {
    throw new Error('Cannot merge nodes: missing node or next node');
  }
  
  if (node.type === 'text' && nextNode.type === 'text') {
    // Merge text nodes
    (node as TextNode).text += (nextNode as TextNode).text;
  } else if ('children' in node && 'children' in nextNode) {
    // Merge element nodes
    (node as ElementNode).children.push(...(nextNode as ElementNode).children);
  } else {
    throw new Error('Cannot merge nodes of different types');
  }
  
  // Remove the second node
  parent.children.splice(index + 1, 1);
}

/**
 * Apply split node operation
 */
function applySplitNodeOperation(model: DocumentModel, operation: SplitNodeOperation): void {
  const node = getNodeAtPath(model, operation.path);
  
  if (!node) {
    throw new Error('Cannot find node');
  }
  
  const parent = getParentNode(model, operation.path);
  
  if (!parent) {
    throw new Error('Cannot find parent node');
  }
  
  const index = operation.path[operation.path.length - 1];
  
  if (node.type === 'text') {
    // Split text node
    const textNode = node as TextNode;
    const [left, right] = TextFormattingOperations.splitTextNode(
      model,
      textNode,
      operation.position
    );
    
    // Replace original node with the two new nodes
    parent.children.splice(index, 1, left, right);
  } else if ('children' in node) {
    // Split element node
    const elementNode = node as ElementNode;
    const leftChildren = elementNode.children.slice(0, operation.position);
    const rightChildren = elementNode.children.slice(operation.position);
    
    // Create new right node with same type and attributes
    const rightNode: ElementNode = {
      type: elementNode.type,
      id: model.createElementNode(elementNode.type).id,
      attributes: { ...elementNode.attributes },
      children: rightChildren
    };
    
    // Update left node (original node)
    elementNode.children = leftChildren;
    
    // Insert right node after left node
    parent.children.splice(index + 1, 0, rightNode);
  }
}

/**
 * Apply move node operation
 */
function applyMoveNodeOperation(model: DocumentModel, operation: MoveNodeOperation): void {
  const sourceParent = getParentNode(model, operation.path);
  
  if (!sourceParent) {
    throw new Error('Cannot find source parent node');
  }
  
  const sourceIndex = operation.path[operation.path.length - 1];
  const node = sourceParent.children[sourceIndex];
  
  if (!node) {
    throw new Error('Cannot find node to move');
  }
  
  // Remove node from source
  sourceParent.children.splice(sourceIndex, 1);
  
  // Adjust target path if needed (if moving within the same parent)
  let targetPath = operation.newPath;
  let targetIndex = targetPath[targetPath.length - 1];
  
  if (operation.path.slice(0, -1).join(',') === targetPath.slice(0, -1).join(',')) {
    // Moving within the same parent
    if (sourceIndex < targetIndex) {
      // If source is before target, target index needs to be adjusted
      targetIndex--;
    }
  }
  
  // Get target parent
  const targetParent = getParentNode(model, targetPath);
  
  if (!targetParent) {
    throw new Error('Cannot find target parent node');
  }
  
  // Insert node at target
  targetParent.children.splice(targetIndex, 0, node);
}

/**
 * Invert an operation for undo
 */
export function invertOperation(operation: AnyOperation): AnyOperation {
  switch (operation.type) {
    case 'insertText':
      return {
        type: 'deleteText',
        path: operation.path,
        offset: operation.offset,
        count: operation.text.length,
        text: operation.text
      };
      
    case 'deleteText':
      return {
        type: 'insertText',
        path: operation.path,
        offset: operation.offset,
        text: operation.text || ''
      };
      
    case 'applyMark':
      return {
        type: 'removeMark',
        path: operation.path,
        mark: operation.mark,
        range: operation.range
      };
      
    case 'removeMark':
      return {
        type: 'applyMark',
        path: operation.path,
        mark: operation.mark,
        range: operation.range
      };
      
    case 'insertNode':
      return {
        type: 'removeNode',
        path: operation.path,
        index: operation.index,
        node: operation.node
      };
      
    case 'removeNode':
      return {
        type: 'insertNode',
        path: operation.path,
        index: operation.index,
        node: operation.node!
      };
      
    case 'setNode':
      return {
        type: 'setNode',
        path: operation.path,
        properties: operation.oldProperties || {},
        oldProperties: operation.properties
      };
      
    case 'mergeNodes':
      return {
        type: 'splitNode',
        path: operation.path,
        position: operation.position,
        properties: operation.properties
      };
      
    case 'splitNode':
      return {
        type: 'mergeNodes',
        path: operation.path,
        position: operation.position,
        properties: operation.properties
      };
      
    case 'moveNode':
      return {
        type: 'moveNode',
        path: operation.newPath,
        newPath: operation.path
      };
      
    default:
      throw new Error(`Unknown operation type: ${(operation as any).type}`);
  }
}