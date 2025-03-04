import { Editor } from '../core/editor';
import { CollaborativeHistoryManager, RemoteOperation } from '../model/collaborative-history';

/**
 * Configuration for collaboration
 */
export interface CollaborationConfig {
  documentId: string;
  serverUrl: string;
  clientId: string;
}

/**
 * Client for collaborative editing
 * Handles communication with the collaboration server
 */
export class CollaborationClient {
  private editor: Editor;
  private config: CollaborationConfig;
  private socket: WebSocket | null = null;
  private historyManager: CollaborativeHistoryManager;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second delay
  
  /**
   * Constructor
   * 
   * @param editor Editor instance
   * @param config Collaboration configuration
   */
  constructor(editor: Editor, config: CollaborationConfig) {
    this.editor = editor;
    this.config = config;
    
    // Create collaborative history manager
    this.historyManager = new CollaborativeHistoryManagerImpl(
      editor.getDocumentModel(),
      config.clientId,
      this
    );
  }
  
  /**
   * Connect to collaboration server
   */
  connect(): void {
    if (this.socket) {
      this.disconnect();
    }
    
    try {
      this.socket = new WebSocket(this.config.serverUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }
  
  /**
   * Disconnect from collaboration server
   */
  disconnect(): void {
    if (this.socket) {
      // Send leave message if connected
      if (this.connected) {
        this.sendLeaveMessage();
      }
      
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }
  
  /**
   * Send an operation to the server
   * 
   * @param operation Operation to send
   */
  sendOperation(operation: RemoteOperation): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send operation, not connected');
      return;
    }
    
    this.socket.send(JSON.stringify({
      type: 'operation',
      documentId: this.config.documentId,
      clientId: this.config.clientId,
      operation
    }));
  }
  
  /**
   * Get the collaborative history manager
   */
  getHistoryManager(): CollaborativeHistoryManager {
    return this.historyManager;
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('Connected to collaboration server');
    this.connected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    
    // Send join message
    this.sendJoinMessage();
  }
  
  /**
   * Handle WebSocket message event
   * 
   * @param event Message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'operation':
          this.handleOperationMessage(message);
          break;
        case 'document':
          this.handleDocumentMessage(message);
          break;
        case 'presence':
          this.handlePresenceMessage(message);
          break;
        case 'error':
          console.error('Server error:', message.error);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
  
  /**
   * Handle WebSocket error event
   * 
   * @param error Error event
   */
  private handleError(error: Event): void {
    console.error('Collaboration error:', error);
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(): void {
    console.log('Disconnected from collaboration server');
    this.connected = false;
    
    // Attempt to reconnect
    this.attemptReconnect();
  }
  
  /**
   * Attempt to reconnect to the server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached, giving up');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * Send join message
   */
  private sendJoinMessage(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    
    this.socket.send(JSON.stringify({
      type: 'join',
      documentId: this.config.documentId,
      clientId: this.config.clientId
    }));
  }
  
  /**
   * Send leave message
   */
  private sendLeaveMessage(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    
    this.socket.send(JSON.stringify({
      type: 'leave',
      documentId: this.config.documentId,
      clientId: this.config.clientId
    }));
  }
  
  /**
   * Handle operation message
   * 
   * @param message Operation message
   */
  private handleOperationMessage(message: any): void {
    const remoteOp: RemoteOperation = message.operation;
    this.historyManager.receiveRemoteOperation(remoteOp);
    
    // Re-render the document
    this.editor.renderDocument();
  }
  
  /**
   * Handle document message
   * 
   * @param message Document message
   */
  private handleDocumentMessage(message: any): void {
    // Update document content
    this.editor.setContent(message.content);
    
    // Reset revision
    // In a real implementation, we would also reset the operation log
    console.log('Document updated from server, revision:', message.revision);
  }
  
  /**
   * Handle presence message
   * 
   * @param message Presence message
   */
  private handlePresenceMessage(message: any): void {
    // Update UI with presence information
    console.log('Presence update:', message.users);
    
    // Emit presence event
    this.editor.getPluginRegistry().emit('collaboration:presence', {
      users: message.users,
      editor: this.editor
    });
  }
}

/**
 * Implementation of CollaborativeHistoryManager that sends operations to the client
 */
class CollaborativeHistoryManagerImpl extends CollaborativeHistoryManager {
  private client: CollaborationClient;
  
  /**
   * Constructor
   * 
   * @param model Document model
   * @param clientId Client ID
   * @param client Collaboration client
   */
  constructor(model: any, clientId: string, client: CollaborationClient) {
    super(model, clientId);
    this.client = client;
  }
  
  /**
   * Override to send operations to the client
   * 
   * @param remoteOp Remote operation
   */
  protected override emitRemoteOperation(remoteOp: RemoteOperation): void {
    this.client.sendOperation(remoteOp);
  }
}