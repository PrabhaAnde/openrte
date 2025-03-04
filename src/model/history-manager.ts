import { AnyOperation } from './operations/operation-types';
import { invertOperation, applyOperation } from './operations/apply-operation';
import { DocumentModel } from './document-model';

/**
 * Manages document history with undo/redo
 */
export class HistoryManager {
  private undoStack: AnyOperation[][] = [];
  private redoStack: AnyOperation[][] = [];
  private currentBatch: AnyOperation[] | null = null;
  private model: DocumentModel;
  
  constructor(model: DocumentModel) {
    this.model = model;
  }
  
  /**
   * Get the document model
   */
  protected getModel(): DocumentModel {
    return this.model;
  }
  
  /**
   * Start a new operation batch
   */
  startBatch(): void {
    if (this.currentBatch) {
      this.endBatch();
    }
    this.currentBatch = [];
  }
  
  /**
   * End current operation batch
   */
  endBatch(): void {
    if (this.currentBatch && this.currentBatch.length > 0) {
      this.undoStack.push(this.currentBatch);
      this.redoStack = []; // Clear redo stack
    }
    this.currentBatch = null;
  }
  
  /**
   * Apply an operation and add to history
   */
  applyOperation(operation: AnyOperation): void {
    // Apply the operation
    applyOperation(this.model, operation);
    
    // Add to current batch or create a new batch
    if (this.currentBatch) {
      this.currentBatch.push(operation);
    } else {
      this.undoStack.push([operation]);
      this.redoStack = []; // Clear redo stack
    }
  }
  
  /**
   * Undo last operation batch
   */
  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    
    const batch = this.undoStack.pop()!;
    const inverseBatch: AnyOperation[] = [];
    
    // Apply inverse operations in reverse order
    for (let i = batch.length - 1; i >= 0; i--) {
      const inverseOp = invertOperation(batch[i]);
      inverseBatch.push(inverseOp);
      applyOperation(this.model, inverseOp);
    }
    
    this.redoStack.push(batch);
    return true;
  }
  
  /**
   * Redo previously undone operation batch
   */
  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    
    const batch = this.redoStack.pop()!;
    
    // Apply operations
    for (const operation of batch) {
      applyOperation(this.model, operation);
    }
    
    this.undoStack.push(batch);
    return true;
  }
  
  /**
   * Clear history stacks
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentBatch = null;
  }
  
  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  
  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}