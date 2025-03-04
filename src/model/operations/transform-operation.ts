import { AnyOperation, InsertTextOperation, DeleteTextOperation, ApplyMarkOperation, RemoveMarkOperation, InsertNodeOperation, RemoveNodeOperation, SetNodeOperation, MergeNodesOperation, SplitNodeOperation, MoveNodeOperation } from './operation-types';
import { compareArrays, comparePaths, isAncestor, getCommonAncestor } from '../../utils/array-utils';

/**
 * Transform an operation against another
 * Ensures that when op1 and op2 are concurrent operations,
 * applying op1 then transform(op2, op1) has the same effect as
 * applying op2 then transform(op1, op2)
 * 
 * @param op1 The operation to transform
 * @param op2 The operation to transform against
 * @returns The transformed operation
 */
export function transformOperation(op1: AnyOperation, op2: AnyOperation): AnyOperation {
  // Handle different operation type combinations
  
  // Text operations
  if (op1.type === 'insertText' && op2.type === 'insertText') {
    return transformInsertInsert(op1, op2);
  }
  
  if (op1.type === 'insertText' && op2.type === 'deleteText') {
    return transformInsertDelete(op1, op2);
  }
  
  if (op1.type === 'deleteText' && op2.type === 'insertText') {
    return transformDeleteInsert(op1, op2);
  }
  
  if (op1.type === 'deleteText' && op2.type === 'deleteText') {
    return transformDeleteDelete(op1, op2);
  }
  
  // Mark operations
  if ((op1.type === 'applyMark' || op1.type === 'removeMark') && 
      (op2.type === 'insertText' || op2.type === 'deleteText')) {
    return transformMarkText(op1, op2);
  }
  
  // Node operations
  if (op1.type === 'insertNode' && op2.type === 'insertNode') {
    return transformInsertNodeInsertNode(op1, op2);
  }
  
  if (op1.type === 'removeNode' && op2.type === 'insertNode') {
    return transformRemoveNodeInsertNode(op1, op2);
  }
  
  if (op1.type === 'insertNode' && op2.type === 'removeNode') {
    return transformInsertNodeRemoveNode(op1, op2);
  }
  
  if (op1.type === 'moveNode' && op2.type === 'moveNode') {
    return transformMoveNodeMoveNode(op1, op2);
  }
  
  // For operations that don't need transformation or aren't implemented yet
  return op1;
}

/**
 * Transform an array of operations against another array
 * 
 * @param ops Operations to transform
 * @param otherOps Operations to transform against
 * @returns Transformed operations
 */
export function transformOperations(
  ops: AnyOperation[],
  otherOps: AnyOperation[]
): AnyOperation[] {
  if (otherOps.length === 0) return ops;
  
  const result: AnyOperation[] = [];
  
  for (const op of ops) {
    let transformedOp = op;
    
    for (const otherOp of otherOps) {
      transformedOp = transformOperation(transformedOp, otherOp);
    }
    
    result.push(transformedOp);
  }
  
  return result;
}

/**
 * Transform insert text against insert text
 */
function transformInsertInsert(op1: InsertTextOperation, op2: InsertTextOperation): InsertTextOperation {
  // If not in the same text node, no transformation needed
  if (!compareArrays(op1.path, op2.path)) {
    return op1;
  }
  
  // If inserting at the same position, the second operation should be shifted
  // by the length of the first operation's text
  if (op1.offset >= op2.offset) {
    return {
      ...op1,
      offset: op1.offset + op2.text.length
    };
  }
  
  // Otherwise, no change needed
  return op1;
}

/**
 * Transform insert text against delete text
 */
function transformInsertDelete(op1: InsertTextOperation, op2: DeleteTextOperation): InsertTextOperation {
  // If not in the same text node, no transformation needed
  if (!compareArrays(op1.path, op2.path)) {
    return op1;
  }
  
  // If inserting before the deletion, no change needed
  if (op1.offset <= op2.offset) {
    return op1;
  }
  
  // If inserting after the deletion, adjust offset
  if (op1.offset >= op2.offset + op2.count) {
    return {
      ...op1,
      offset: op1.offset - op2.count
    };
  }
  
  // If inserting within the deletion range, insert at the deletion point
  return {
    ...op1,
    offset: op2.offset
  };
}

/**
 * Transform delete text against insert text
 */
function transformDeleteInsert(op1: DeleteTextOperation, op2: InsertTextOperation): DeleteTextOperation {
  // If not in the same text node, no transformation needed
  if (!compareArrays(op1.path, op2.path)) {
    return op1;
  }
  
  // If deleting before the insertion, no change needed
  if (op1.offset + op1.count <= op2.offset) {
    return op1;
  }
  
  // If deleting starts before insertion but overlaps
  if (op1.offset < op2.offset) {
    return {
      ...op1,
      count: op1.count + op2.text.length
    };
  }
  
  // If deleting after the insertion, adjust offset
  return {
    ...op1,
    offset: op1.offset + op2.text.length
  };
}

/**
 * Transform delete text against delete text
 */
function transformDeleteDelete(op1: DeleteTextOperation, op2: DeleteTextOperation): DeleteTextOperation {
  // If not in the same text node, no transformation needed
  if (!compareArrays(op1.path, op2.path)) {
    return op1;
  }
  
  // If deleting before the other deletion, no change needed
  if (op1.offset + op1.count <= op2.offset) {
    return op1;
  }
  
  // If deleting after the other deletion, adjust offset
  if (op1.offset >= op2.offset + op2.count) {
    return {
      ...op1,
      offset: op1.offset - op2.count
    };
  }
  
  // If deletions overlap
  
  // Case 1: op1 completely within op2
  if (op1.offset >= op2.offset && op1.offset + op1.count <= op2.offset + op2.count) {
    // The deletion is already covered by op2, so return a no-op deletion
    return {
      ...op1,
      offset: op2.offset,
      count: 0
    };
  }
  
  // Case 2: op1 starts before op2 but ends within op2
  if (op1.offset < op2.offset && op1.offset + op1.count <= op2.offset + op2.count) {
    return {
      ...op1,
      count: op2.offset - op1.offset
    };
  }
  
  // Case 3: op1 starts within op2 but ends after op2
  if (op1.offset >= op2.offset && op1.offset < op2.offset + op2.count) {
    const endOffset = op1.offset + op1.count;
    return {
      ...op1,
      offset: op2.offset,
      count: endOffset - (op2.offset + op2.count)
    };
  }
  
  // Case 4: op1 completely contains op2
  return {
    ...op1,
    count: op1.count - op2.count
  };
}

/**
 * Transform mark operations against text operations
 */
function transformMarkText(
  op1: ApplyMarkOperation | RemoveMarkOperation,
  op2: InsertTextOperation | DeleteTextOperation
): ApplyMarkOperation | RemoveMarkOperation {
  // If not in the same text node, no transformation needed
  if (!compareArrays(op1.path, op2.path)) {
    return op1;
  }
  
  const [start, end] = op1.range;
  
  if (op2.type === 'insertText') {
    // If insertion is before mark range start, adjust range
    if (op2.offset <= start) {
      return {
        ...op1,
        range: [start + op2.text.length, end + op2.text.length]
      };
    }
    
    // If insertion is within mark range, adjust end
    if (op2.offset > start && op2.offset < end) {
      return {
        ...op1,
        range: [start, end + op2.text.length]
      };
    }
    
    // If insertion is after mark range, no change needed
    return op1;
  }
  
  if (op2.type === 'deleteText') {
    const deleteEnd = op2.offset + op2.count;
    
    // If deletion is before mark range start, adjust range
    if (deleteEnd <= start) {
      return {
        ...op1,
        range: [start - op2.count, end - op2.count]
      };
    }
    
    // If deletion completely contains mark range, make it a no-op
    if (op2.offset <= start && deleteEnd >= end) {
      return {
        ...op1,
        range: [op2.offset, op2.offset]
      };
    }
    
    // If deletion starts before mark range but ends within it
    if (op2.offset <= start && deleteEnd < end) {
      return {
        ...op1,
        range: [op2.offset, end - op2.count]
      };
    }
    
    // If deletion starts within mark range but ends after it
    if (op2.offset > start && op2.offset < end && deleteEnd >= end) {
      return {
        ...op1,
        range: [start, op2.offset]
      };
    }
    
    // If deletion is completely within mark range
    if (op2.offset > start && deleteEnd < end) {
      return {
        ...op1,
        range: [start, end - op2.count]
      };
    }
    
    // If deletion is after mark range, no change needed
    return op1;
  }
  
  return op1;
}

/**
 * Transform insert node against insert node
 */
function transformInsertNodeInsertNode(op1: InsertNodeOperation, op2: InsertNodeOperation): InsertNodeOperation {
  // If not in the same parent, no transformation needed
  if (!compareArrays(op1.path, op2.path)) {
    return op1;
  }
  
  // If inserting at the same index or after, adjust index
  if (op1.index >= op2.index) {
    return {
      ...op1,
      index: op1.index + 1
    };
  }
  
  // Otherwise, no change needed
  return op1;
}

/**
 * Transform remove node against insert node
 */
function transformRemoveNodeInsertNode(op1: RemoveNodeOperation, op2: InsertNodeOperation): RemoveNodeOperation {
  // If not in the same parent, no transformation needed
  if (!compareArrays(op1.path, op2.path)) {
    return op1;
  }
  
  // If removing at the same index or after, adjust index
  if (op1.index >= op2.index) {
    return {
      ...op1,
      index: op1.index + 1
    };
  }
  
  // Otherwise, no change needed
  return op1;
}

/**
 * Transform insert node against remove node
 */
function transformInsertNodeRemoveNode(op1: InsertNodeOperation, op2: RemoveNodeOperation): InsertNodeOperation {
  // If not in the same parent, no transformation needed
  if (!compareArrays(op1.path, op2.path)) {
    return op1;
  }
  
  // If inserting at the same index or after, adjust index
  if (op1.index > op2.index) {
    return {
      ...op1,
      index: op1.index - 1
    };
  }
  
  // Otherwise, no change needed
  return op1;
}

/**
 * Transform move node against move node
 */
function transformMoveNodeMoveNode(op1: MoveNodeOperation, op2: MoveNodeOperation): MoveNodeOperation {
  // If moving different nodes, we need to check if the paths affect each other
  
  // Case 1: op2 moves the node that op1 is trying to move
  if (compareArrays(op1.path, op2.path)) {
    return {
      ...op1,
      path: op2.newPath
    };
  }
  
  // Case 2: op2 moves a node that affects the source path of op1
  if (isAncestor(op2.path, op1.path)) {
    // The source path needs to be updated
    const pathDiff = op1.path.slice(op2.path.length);
    return {
      ...op1,
      path: [...op2.newPath, ...pathDiff]
    };
  }
  
  // Case 3: op2 moves a node that affects the target path of op1
  if (isAncestor(op2.path, op1.newPath)) {
    // The target path needs to be updated
    const pathDiff = op1.newPath.slice(op2.path.length);
    return {
      ...op1,
      newPath: [...op2.newPath, ...pathDiff]
    };
  }
  
  // Case 4: op2 removes a node before the source of op1 in the same parent
  if (op2.path.length === op1.path.length - 1 && 
      compareArrays(op2.path, op1.path.slice(0, -1)) && 
      op2.path[op2.path.length - 1] < op1.path[op1.path.length - 1]) {
    return {
      ...op1,
      path: [...op1.path.slice(0, -1), op1.path[op1.path.length - 1] - 1]
    };
  }
  
  // Case 5: op2 inserts a node before the target of op1 in the same parent
  if (op2.newPath.length === op1.newPath.length - 1 && 
      compareArrays(op2.newPath, op1.newPath.slice(0, -1)) && 
      op2.newPath[op2.newPath.length - 1] <= op1.newPath[op1.newPath.length - 1]) {
    return {
      ...op1,
      newPath: [...op1.newPath.slice(0, -1), op1.newPath[op1.newPath.length - 1] + 1]
    };
  }
  
  // Otherwise, no transformation needed
  return op1;
}