import { AnyOperation, InsertTextOperation, DeleteTextOperation, ApplyMarkOperation, RemoveMarkOperation, InsertNodeOperation, RemoveNodeOperation, SetNodeOperation, MergeNodesOperation, SplitNodeOperation, MoveNodeOperation } from './operation-types';
import { compareArrays } from '../../utils/array-utils';

/**
 * Compose two operations into a single operation
 * The result should have the same effect as applying op1 then op2
 * 
 * @param op1 First operation
 * @param op2 Second operation
 * @returns Composed operation or null if operations cannot be composed
 */
export function composeOperations(op1: AnyOperation, op2: AnyOperation): AnyOperation | null {
  // Handle different operation type combinations
  
  // Text operations
  if (op1.type === 'insertText' && op2.type === 'insertText') {
    return composeInsertInsert(op1, op2);
  }
  
  if (op1.type === 'insertText' && op2.type === 'deleteText') {
    return composeInsertDelete(op1, op2);
  }
  
  if (op1.type === 'deleteText' && op2.type === 'deleteText') {
    return composeDeleteDelete(op1, op2);
  }
  
  if (op1.type === 'deleteText' && op2.type === 'insertText') {
    return composeDeleteInsert(op1, op2);
  }
  
  // Mark operations
  if (op1.type === 'applyMark' && op2.type === 'applyMark') {
    return composeApplyMarkApplyMark(op1, op2);
  }
  
  if (op1.type === 'applyMark' && op2.type === 'removeMark') {
    return composeApplyMarkRemoveMark(op1, op2);
  }
  
  if (op1.type === 'removeMark' && op2.type === 'applyMark') {
    return composeRemoveMarkApplyMark(op1, op2);
  }
  
  // Node operations
  if (op1.type === 'setNode' && op2.type === 'setNode') {
    return composeSetNodeSetNode(op1, op2);
  }
  
  // If operations cannot be composed, return null
  return null;
}

/**
 * Compose an array of operations into a minimal set
 * 
 * @param ops Operations to compose
 * @returns Composed operations
 */
export function composeOperationArray(ops: AnyOperation[]): AnyOperation[] {
  if (ops.length <= 1) return ops;
  
  const result: AnyOperation[] = [];
  let current: AnyOperation | null = null;
  
  for (const op of ops) {
    if (!current) {
      current = op;
    } else {
      const composed = composeOperations(current, op);
      if (composed) {
        current = composed;
      } else {
        result.push(current);
        current = op;
      }
    }
  }
  
  if (current) {
    result.push(current);
  }
  
  return result;
}

/**
 * Compose two insert text operations
 */
function composeInsertInsert(op1: InsertTextOperation, op2: InsertTextOperation): InsertTextOperation | null {
  // Can only compose if they're in the same path
  if (!compareArrays(op1.path, op2.path)) {
    return null;
  }
  
  // If the second insert is right after the first one, we can combine them
  if (op1.offset + op1.text.length === op2.offset) {
    return {
      type: 'insertText',
      path: op1.path,
      offset: op1.offset,
      text: op1.text + op2.text
    };
  }
  
  return null;
}

/**
 * Compose insert text followed by delete text
 */
function composeInsertDelete(op1: InsertTextOperation, op2: DeleteTextOperation): AnyOperation | null {
  // Can only compose if they're in the same path
  if (!compareArrays(op1.path, op2.path)) {
    return null;
  }
  
  // If delete starts before insert, can't compose
  if (op2.offset < op1.offset) {
    return null;
  }
  
  // If delete starts after the end of insert, can't compose
  if (op2.offset >= op1.offset + op1.text.length) {
    return null;
  }
  
  // If delete is entirely within the inserted text
  if (op2.offset >= op1.offset && op2.offset + op2.count <= op1.offset + op1.text.length) {
    // Calculate the new text with the deleted portion removed
    const beforeDelete = op1.text.substring(0, op2.offset - op1.offset);
    const afterDelete = op1.text.substring(op2.offset - op1.offset + op2.count);
    
    return {
      type: 'insertText',
      path: op1.path,
      offset: op1.offset,
      text: beforeDelete + afterDelete
    };
  }
  
  return null;
}

/**
 * Compose two delete text operations
 */
function composeDeleteDelete(op1: DeleteTextOperation, op2: DeleteTextOperation): DeleteTextOperation | null {
  // Can only compose if they're in the same path
  if (!compareArrays(op1.path, op2.path)) {
    return null;
  }
  
  // If the second delete starts at the same position as the first
  if (op2.offset === op1.offset) {
    return {
      type: 'deleteText',
      path: op1.path,
      offset: op1.offset,
      count: op1.count + op2.count,
      text: op1.text && op2.text ? op1.text + op2.text : undefined
    };
  }
  
  // If the second delete starts right after the first one
  if (op2.offset === op1.offset + op1.count) {
    return {
      type: 'deleteText',
      path: op1.path,
      offset: op1.offset,
      count: op1.count + op2.count,
      text: op1.text && op2.text ? op1.text + op2.text : undefined
    };
  }
  
  return null;
}

/**
 * Compose delete text followed by insert text
 */
function composeDeleteInsert(op1: DeleteTextOperation, op2: InsertTextOperation): AnyOperation | null {
  // Can only compose if they're in the same path
  if (!compareArrays(op1.path, op2.path)) {
    return null;
  }
  
  // If insert happens at the delete position, we can potentially simplify
  if (op2.offset === op1.offset) {
    // If the inserted text is the same as what was deleted, they cancel out
    if (op1.text === op2.text) {
      return null; // No operation needed
    }
    
    // If the inserted text is shorter than what was deleted
    if (op1.text && op2.text.length < op1.text.length) {
      return {
        type: 'deleteText',
        path: op1.path,
        offset: op1.offset + op2.text.length,
        count: op1.count - op2.text.length,
        text: op1.text.substring(op2.text.length)
      };
    }
    
    // If the inserted text is longer than what was deleted
    if (op1.text && op2.text.length > op1.text.length) {
      return {
        type: 'insertText',
        path: op1.path,
        offset: op1.offset,
        text: op2.text.substring(0, op2.text.length - op1.text.length)
      };
    }
  }
  
  return null;
}

/**
 * Compose two apply mark operations
 */
function composeApplyMarkApplyMark(op1: ApplyMarkOperation, op2: ApplyMarkOperation): ApplyMarkOperation | null {
  // Can only compose if they're in the same path and for the same mark type
  if (!compareArrays(op1.path, op2.path) || op1.mark.type !== op2.mark.type) {
    return null;
  }
  
  // If the ranges overlap or are adjacent, we can combine them
  const [start1, end1] = op1.range;
  const [start2, end2] = op2.range;
  
  if (end1 >= start2 - 1 && start1 <= end2 + 1) {
    return {
      type: 'applyMark',
      path: op1.path,
      mark: op2.mark, // Use the second mark value if different
      range: [Math.min(start1, start2), Math.max(end1, end2)]
    };
  }
  
  return null;
}

/**
 * Compose apply mark followed by remove mark
 */
function composeApplyMarkRemoveMark(op1: ApplyMarkOperation, op2: RemoveMarkOperation): AnyOperation | null {
  // Can only compose if they're in the same path and for the same mark type
  if (!compareArrays(op1.path, op2.path) || op1.mark.type !== op2.mark.type) {
    return null;
  }
  
  const [start1, end1] = op1.range;
  const [start2, end2] = op2.range;
  
  // If remove completely covers apply, they cancel out
  if (start2 <= start1 && end2 >= end1) {
    return null; // No operation needed
  }
  
  // If remove partially overlaps with apply, we need to adjust the apply range
  if (start2 <= end1 && end2 >= start1) {
    // Several cases to handle
    
    // Case 1: Remove cuts off the beginning of apply
    if (start2 <= start1 && end2 < end1) {
      return {
        type: 'applyMark',
        path: op1.path,
        mark: op1.mark,
        range: [end2 + 1, end1]
      };
    }
    
    // Case 2: Remove cuts off the end of apply
    if (start2 > start1 && end2 >= end1) {
      return {
        type: 'applyMark',
        path: op1.path,
        mark: op1.mark,
        range: [start1, start2 - 1]
      };
    }
    
    // Case 3: Remove cuts out the middle of apply
    if (start2 > start1 && end2 < end1) {
      // This would result in two separate apply operations, which we can't represent
      // as a single operation. Return null to indicate we can't compose.
      return null;
    }
  }
  
  return null;
}

/**
 * Compose remove mark followed by apply mark
 */
function composeRemoveMarkApplyMark(op1: RemoveMarkOperation, op2: ApplyMarkOperation): AnyOperation | null {
  // Can only compose if they're in the same path and for the same mark type
  if (!compareArrays(op1.path, op2.path) || op1.mark.type !== op2.mark.type) {
    return null;
  }
  
  const [start1, end1] = op1.range;
  const [start2, end2] = op2.range;
  
  // If apply completely covers remove, they cancel out
  if (start2 <= start1 && end2 >= end1) {
    return null; // No operation needed
  }
  
  // Other partial overlaps are complex and would result in multiple operations
  // Return null to indicate we can't compose
  return null;
}

/**
 * Compose two set node operations
 */
function composeSetNodeSetNode(op1: SetNodeOperation, op2: SetNodeOperation): SetNodeOperation | null {
  // Can only compose if they're for the same node
  if (!compareArrays(op1.path, op2.path)) {
    return null;
  }
  
  // Combine the properties, with op2 taking precedence
  const properties: Record<string, any> = { ...op1.properties };
  
  // Add or override properties from op2
  for (const key in op2.properties) {
    properties[key] = (op2.properties as any)[key];
  }
  
  return {
    type: 'setNode',
    path: op1.path,
    properties,
    oldProperties: op1.oldProperties // Keep the original old properties
  };
}