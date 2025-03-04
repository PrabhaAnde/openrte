import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { CollaborationConfig } from '../../collaboration/collaboration-client';
import { IconName } from '../../ui/icon';

/**
 * Plugin for enabling collaborative editing
 */
export class CollaborationPlugin extends BasePlugin {
  private enabled: boolean = false;
  private config: CollaborationConfig | null = null;
  private statusElement: HTMLElement | null = null;
  
  /**
   * Constructor
   *
   * @param config Collaboration configuration
   */
  constructor(config?: CollaborationConfig) {
    super(
      'collaboration',
      'users' as IconName, // Assuming 'users' icon exists, adjust as needed
      'Collaboration'
    );
    
    if (config) {
      this.config = config;
    }
  }
  
  /**
   * Get plugin name
   */
  getName(): string {
    return 'collaboration';
  }
  
  /**
   * Initialize plugin
   *
   * @param editor Editor instance
   */
  override init(editor: Editor): void {
    // Call the base class init first
    super.init(editor);
    
    // Listen for collaboration events
    editor.getPluginRegistry().on('collaboration:presence', this.handlePresenceUpdate.bind(this));
    editor.getPluginRegistry().on('editor:collaboration', this.handleCollaborationToggle.bind(this));
    
    // If config was provided in constructor, enable collaboration
    if (this.config) {
      this.enable();
    }
  }
  
  /**
   * Create toolbar control
   */
  override createToolbarControl(): HTMLElement {
    // Create a container for our custom control
    const container = document.createElement('div');
    container.className = 'openrte-collaboration-control';
    
    // Add the base button (created by BasePlugin)
    container.appendChild(super.createToolbarControl());
    
    // Create status indicator
    this.statusElement = document.createElement('span');
    this.statusElement.className = 'openrte-collaboration-status';
    this.updateStatusElement();
    
    // Add status element to container
    container.appendChild(this.statusElement);
    
    return container;
  }
  
  /**
   * Execute plugin
   */
  override execute(): void {
    if (this.enabled) {
      this.disable();
    } else {
      // If no config, prompt for one
      if (!this.config) {
        this.promptForConfig();
      } else {
        this.enable();
      }
    }
  }
  
  /**
   * DOM-based execution for backward compatibility
   * Required by BasePlugin abstract class
   */
  protected executeDOMBased(): void {
    // For collaboration, we use the same logic as execute()
    if (this.enabled) {
      this.disable();
    } else {
      // If no config, prompt for one
      if (!this.config) {
        this.promptForConfig();
      } else {
        this.enable();
      }
    }
  }
  
  /**
   * Enable collaboration
   */
  enable(): void {
    if (!this.editor || !this.config) return;
    
    this.editor.enableCollaboration(this.config);
    this.enabled = true;
    this.updateStatusElement();
  }
  
  /**
   * Disable collaboration
   */
  disable(): void {
    if (!this.editor) return;
    
    this.editor.disableCollaboration();
    this.enabled = false;
    this.updateStatusElement();
  }
  
  /**
   * Set collaboration configuration
   * 
   * @param config Collaboration configuration
   */
  setConfig(config: CollaborationConfig): void {
    this.config = config;
    
    // If already enabled, restart with new config
    if (this.enabled && this.editor) {
      this.editor.disableCollaboration();
      this.editor.enableCollaboration(config);
    }
  }
  
  /**
   * Handle presence update event
   * 
   * @param event Presence event
   */
  private handlePresenceUpdate(event: any): void {
    if (this.statusElement) {
      const userCount = event.users ? event.users.length : 0;
      this.statusElement.textContent = `${userCount} user${userCount !== 1 ? 's' : ''}`;
    }
  }
  
  /**
   * Handle collaboration toggle event
   * 
   * @param event Collaboration event
   */
  private handleCollaborationToggle(event: any): void {
    this.enabled = event.enabled;
    this.updateStatusElement();
  }
  
  /**
   * Update status element
   */
  private updateStatusElement(): void {
    if (this.statusElement) {
      this.statusElement.textContent = this.enabled ? 'Connected' : 'Disconnected';
      this.statusElement.className = `openrte-collaboration-status ${this.enabled ? 'connected' : 'disconnected'}`;
    }
  }
  
  /**
   * Prompt for collaboration configuration
   * This is a simple implementation that could be replaced with a modal dialog
   */
  private promptForConfig(): void {
    const serverUrl = prompt('Enter collaboration server URL:', 'wss://example.com/collaboration');
    if (!serverUrl) return;
    
    const documentId = prompt('Enter document ID:', 'doc-' + Math.random().toString(36).substring(2, 9));
    if (!documentId) return;
    
    const clientId = 'client-' + Math.random().toString(36).substring(2, 9);
    
    this.config = {
      serverUrl,
      documentId,
      clientId
    };
    
    this.enable();
  }
}