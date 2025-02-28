import { Plugin } from '../types/plugin';
import { Editor } from './editor';
import { EventBus } from './event-bus';

/**
 * Plugin Registry manages the collection of plugins and their lifecycle.
 */
export class PluginRegistry {
  /**
   * Map of plugin names to plugin instances
   */
  private plugins: Map<string, Plugin> = new Map();
  
  /**
   * Event bus for inter-plugin communication
   */
  private eventBus: EventBus = new EventBus();
  
  /**
   * Register a plugin
   * 
   * @param plugin Plugin instance to register
   */
  register(plugin: Plugin): void {
    const pluginName = plugin.getName();
    
    // Check for duplicate plugins
    if (this.plugins.has(pluginName)) {
      console.warn(`Plugin with name "${pluginName}" is already registered. It will be replaced.`);
    }
    
    this.plugins.set(pluginName, plugin);
    
    // Emit plugin registration event
    this.eventBus.emit('plugin:registered', { 
      name: pluginName, 
      plugin 
    });
  }
  
  /**
   * Get a plugin by name
   * 
   * @param name The name of the plugin to get
   * @returns The plugin instance or undefined if not found
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
  
  /**
   * Get all registered plugins
   * 
   * @returns Array of plugin instances
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get all toolbar controls from plugins
   * 
   * @returns Array of HTMLElements for the toolbar
   */
  getToolbarControls(): HTMLElement[] {
    return this.getAllPlugins().map(plugin => plugin.createToolbarControl());
  }
  
  /**
   * Initialize all plugins with editor instance
   * 
   * @param editor The editor instance to initialize plugins with
   */
  initAll(editor: Editor): void {
    this.getAllPlugins().forEach(plugin => {
      try {
        plugin.init(editor);
        
        // Emit plugin initialization event
        this.eventBus.emit('plugin:initialized', { 
          name: plugin.getName(), 
          plugin 
        });
      } catch (e) {
        console.error(`Error initializing plugin "${plugin.getName()}":`, e);
      }
    });
  }
  
  /**
   * Destroy all plugins
   */
  destroyAll(): void {
    this.getAllPlugins().forEach(plugin => {
      try {
        plugin.destroy();
        
        // Emit plugin destruction event
        this.eventBus.emit('plugin:destroyed', { 
          name: plugin.getName(), 
          plugin 
        });
      } catch (e) {
        console.error(`Error destroying plugin "${plugin.getName()}":`, e);
      }
    });
    
    // Clear plugins
    this.plugins.clear();
    
    // Clear event bus
    this.eventBus.clearAll();
  }
  
  /**
   * Get the event bus for inter-plugin communication
   * 
   * @returns The event bus instance
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
  
  /**
   * Subscribe to a plugin event
   * 
   * @param event The event name
   * @param callback The callback function
   */
  on(event: string, callback: (data: any) => void): void {
    this.eventBus.on(event, callback);
  }
  
  /**
   * Unsubscribe from a plugin event
   * 
   * @param event The event name
   * @param callback The callback function
   */
  off(event: string, callback: (data: any) => void): void {
    this.eventBus.off(event, callback);
  }
  
  /**
   * Emit a plugin event
   * 
   * @param event The event name
   * @param data The event data
   */
  emit(event: string, data: any): void {
    this.eventBus.emit(event, data);
  }
}