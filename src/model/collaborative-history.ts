import { HistoryManager } from './history-manager';
import { DocumentModel } from './document-model';
import { AnyOperation } from './operations/operation-types';
import { transformOperations } from './operations/transform-operation';
import { composeOperationArray } from './operations/compose-operation';
import { applyOperation } from './operations/apply-operation';

/**
 * Interface for remote operations received from collaboration server
 */
export interface RemoteOperation {
  operations: AnyOperation[];
  origin: string; // Identifier for the source of the operation
  revision: number; // Document revision number
}

/**
 * Manages document history with undo/redo and collaboration support
 * Extends the basic HistoryManager with transformation capabilities
 */
export class CollaborativeHistoryManager extends HistoryManager {
  private pendingRemoteOps: RemoteOperation[] = [];
  private revision: number = 0;
  private clientId: string;
  private operationLog: AnyOperation[][] = []; // Log of operations for transformation
  
  /**
   * Constructor
   * 
   * @param model Document model
   * @param clientId Unique identifier for this client
   */
  constructor(model: DocumentModel, clientId: string) {
    super(model);
    this.clientId = clientId;
  }
  
  /**
   * Apply a local operation
   * 
   * @param operation Operation to apply
   */
  applyLocalOperation(operation: AnyOperation): void {
    // Apply to model and add to history
    super.applyOperation(operation);
    
    // Log operation for transformation
    this.logOperation([operation]);
    
    // Emit for collaboration
    this.emitOperation(operation);
  }
  
  /**
   * Apply a batch of local operations
   * 
   * @param operations Operations to apply
   */
  applyLocalBatch(operations: AnyOperation[]): void {
    // Start batch
    this.startBatch();
    
    // Apply each operation
    for (const op of operations) {
      super.applyOperation(op);
    }
    
    // End batch
    this.endBatch();
    
    // Log operations for transformation
    this.logOperation(operations);
    
    // Emit for collaboration
    this.emitOperations(operations);
  }
  
  /**
   * Log operations for transformation
   * 
   * @param operations Operations to log
   */
  private logOperation(operations: AnyOperation[]): void {
    this.operationLog.push([...operations]);
    
    // Limit log size to prevent memory issues
    if (this.operationLog.length > 100) {
      this.operationLog.shift();
    }
  }
  
  /**
   * Receive a remote operation
   * 
   * @param remoteOp Remote operation
   */
  receiveRemoteOperation(remoteOp: RemoteOperation): void {
    if (remoteOp.origin === this.clientId) {
      // Ignore our own operations that come back
      return;
    }
    
    if (remoteOp.revision > this.revision) {
      // Queue operations from the future
      this.pendingRemoteOps.push(remoteOp);
      this.pendingRemoteOps.sort((a, b) => a.revision - b.revision);
      return;
    }
    
    if (remoteOp.revision < this.revision) {
      // Operation from the past, need to transform
      const transformedOps = transformOperations(
        remoteOp.operations,
        this.getOperationsSinceRevision(remoteOp.revision)
      );
      
      // Apply transformed operations
      this.applyRemoteOperations(transformedOps);
    } else {
      // Current revision, apply directly
      this.applyRemoteOperations(remoteOp.operations);
      this.revision++;
      
      // Process any pending operations
      this.processPendingOperations();
    }
  }
  
  /**
   * Process any pending remote operations
   */
  private processPendingOperations(): void {
    while (this.pendingRemoteOps.length > 0 && 
           this.pendingRemoteOps[0].revision === this.revision) {
      const nextOp = this.pendingRemoteOps.shift()!;
      this.applyRemoteOperations(nextOp.operations);
      this.revision++;
    }
  }
  
  /**
   * Apply remote operations to the model
   * 
   * @param operations Operations to apply
   */
  private applyRemoteOperations(operations: AnyOperation[]): void {
    // Apply operations to model but don't add to history
    for (const op of operations) {
      applyOperation(this.getModel(), op);
    }
    
    // Log operations for transformation
    this.logOperation(operations);
  }
  
  /**
   * Emit operation for collaboration
   * 
   * @param operation Operation to emit
   */
  private emitOperation(operation: AnyOperation): void {
    this.emitOperations([operation]);
  }
  
  /**
   * Emit operations for collaboration
   * 
   * @param operations Operations to emit
   */
  private emitOperations(operations: AnyOperation[]): void {
    // Compose operations if possible
    const composedOps = composeOperationArray(operations);
    
    // Create remote operation object
    const remoteOp: RemoteOperation = {
      operations: composedOps,
      origin: this.clientId,
      revision: this.revision
    };
    
    // Emit operation
    this.emitRemoteOperation(remoteOp);
    
    // Increment revision after sending
    this.revision++;
  }
  
  /**
   * Override with actual sending implementation
   * 
   * @param remoteOp Remote operation to emit
   */
  protected emitRemoteOperation(remoteOp: RemoteOperation): void {
    // In a real implementation, this would be overridden to send 
    // operations to a collaboration server
    console.log('Remote operation emitted:', remoteOp);
  }
  
  /**
   * Get operations since a specific revision
   * 
   * @param revision Revision number
   * @returns Operations since the revision
   */
  private getOperationsSinceRevision(revision: number): AnyOperation[] {
    // Calculate how many operations to skip based on revision difference
    const revisionDiff = this.revision - revision;
    const startIndex = Math.max(0, this.operationLog.length - revisionDiff);
    
    // Flatten operations from log
    return this.operationLog.slice(startIndex).reduce((acc, ops) => acc.concat(ops), [] as AnyOperation[]);
  }
  
  /**
   * Override undo to handle collaborative editing
   */
  override undo(): boolean {
    const result = super.undo();
    
    if (result) {
      // Emit undo as operations
      // In a real implementation, we would emit the inverse operations
      // that were applied during undo
      
      // For now, we'll just log that an undo happened
      console.log('Undo in collaborative mode');
    }
    
    return result;
  }
  
  /**
   * Override redo to handle collaborative editing
   */
  override redo(): boolean {
    const result = super.redo();
    
    if (result) {
      // Emit redo as operations
      // In a real implementation, we would emit the operations
      // that were re-applied during redo
      
      // For now, we'll just log that a redo happened
      console.log('Redo in collaborative mode');
    }
    
    return result;
  }
}