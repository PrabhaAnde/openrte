/**
 * EventBus for OpenRTE
 * 
 * This module provides a pub/sub mechanism for communication
 * between editor components and plugins.
 */

/**
 * Type for event callback functions
 */
export type EventCallback = (data: any) => void;

/**
 * Event bus implementation for inter-plugin communication
 */
export class EventBus {
  /**
   * Map of event names to sets of callbacks
   */
  private listeners: Map<string, Set<EventCallback>> = new Map();
  
  /**
   * Subscribe to an event
   * 
   * @param event The event name to subscribe to
   * @param callback The callback function to be called when the event is emitted
   */
  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
  }
  
  /**
   * Unsubscribe from an event
   * 
   * @param event The event name to unsubscribe from
   * @param callback The callback function to remove
   */
  off(event: string, callback: EventCallback): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
      
      // Clean up empty sets
      if (this.listeners.get(event)!.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
  
  /**
   * Emit an event with data
   * 
   * @param event The event name to emit
   * @param data The data to pass to callbacks
   */
  emit(event: string, data: any = null): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in event handler for "${event}":`, e);
        }
      });
    }
  }
  
  /**
   * Check if an event has subscribers
   * 
   * @param event The event name to check
   * @returns True if the event has subscribers
   */
  hasListeners(event: string): boolean {
    return this.listeners.has(event) && this.listeners.get(event)!.size > 0;
  }
  
  /**
   * Get the number of subscribers for an event
   * 
   * @param event The event name to check
   * @returns The number of subscribers
   */
  listenerCount(event: string): number {
    return this.listeners.has(event) ? this.listeners.get(event)!.size : 0;
  }
  
  /**
   * Remove all listeners for a specific event
   * 
   * @param event The event to clear listeners for
   */
  clearEvent(event: string): void {
    if (this.listeners.has(event)) {
      this.listeners.delete(event);
    }
  }
  
  /**
   * Remove all event listeners
   */
  clearAll(): void {
    this.listeners.clear();
  }
  
  /**
   * Get all registered event names
   * 
   * @returns Array of event names
   */
  getEventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}

// Export a singleton instance for global use
export const globalEventBus = new EventBus();