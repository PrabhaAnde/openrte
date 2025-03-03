import { DocumentNode } from './interfaces';
import { DocumentRenderer } from './document-renderer';
import { DocumentModel } from './document-model';

/**
 * Interface for rendering statistics
 */
export interface RenderStats {
  totalRenders: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  lastRenderTimestamp: number;
}

/**
 * Manages the rendering of the document model to the DOM
 */
export class RenderingManager {
  private container: HTMLElement;
  private documentModel: DocumentModel;
  private lastRenderTime: number = 0;
  private renderStats: RenderStats = {
    totalRenders: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    lastRenderTimestamp: 0
  };
  
  constructor(container: HTMLElement, documentModel: DocumentModel) {
    this.container = container;
    this.documentModel = documentModel;
  }
  
  /**
   * Render the current document
   */
  render(): void {
    const startTime = performance.now();
    
    const document = this.documentModel.getDocument();
    DocumentRenderer.renderDocument(document, this.container);
    
    const endTime = performance.now();
    this.updateRenderStats(startTime, endTime);
  }
  
  /**
   * Update rendering statistics
   */
  private updateRenderStats(startTime: number, endTime: number): void {
    const renderTime = endTime - startTime;
    
    this.renderStats.totalRenders++;
    this.renderStats.totalRenderTime += renderTime;
    this.renderStats.lastRenderTime = renderTime;
    this.renderStats.lastRenderTimestamp = endTime;
    this.renderStats.averageRenderTime = 
      this.renderStats.totalRenderTime / this.renderStats.totalRenders;
    
    this.lastRenderTime = endTime;
  }
  
  /**
   * Get rendering statistics
   */
  getRenderStats(): RenderStats {
    return { ...this.renderStats };
  }
  
  /**
   * Render only if content has changed since last render
   * 
   * @param force Force rendering even if content hasn't changed
   */
  renderIfNeeded(force: boolean = false): boolean {
    // In a more advanced implementation, we would check if the model
    // has changed since the last render by comparing timestamps or
    // using a dirty flag. For now, we'll always render if requested.
    
    if (force) {
      this.render();
      return true;
    }
    
    // Simple dirty checking logic could be implemented here
    // For now, we'll just return false to indicate no render was needed
    return false;
  }
  
  /**
   * Get the document model
   */
  getDocumentModel(): DocumentModel {
    return this.documentModel;
  }
  
  /**
   * Get the container element
   */
  getContainer(): HTMLElement {
    return this.container;
  }
}