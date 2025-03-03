import { PluginModelAdapter } from './plugin-model-adapter';

/**
 * Registry for plugin model adapters
 * 
 * Allows plugins to register and retrieve model adapters
 * for different operations.
 */
export class AdapterRegistry {
  /**
   * Map of plugin names to their model adapters
   */
  private adapters: Map<string, PluginModelAdapter> = new Map();
  
  /**
   * Register an adapter for a plugin
   * 
   * @param pluginName The unique name of the plugin
   * @param adapter The model adapter for the plugin
   */
  register(pluginName: string, adapter: PluginModelAdapter): void {
    this.adapters.set(pluginName, adapter);
  }
  
  /**
   * Get an adapter for a plugin
   * 
   * @param pluginName The unique name of the plugin
   * @returns The model adapter or undefined if not found
   */
  getAdapter(pluginName: string): PluginModelAdapter | undefined {
    return this.adapters.get(pluginName);
  }
  
  /**
   * Check if an adapter exists for a plugin
   * 
   * @param pluginName The unique name of the plugin
   * @returns True if an adapter exists for the plugin
   */
  hasAdapter(pluginName: string): boolean {
    return this.adapters.has(pluginName);
  }
  
  /**
   * Get all registered adapters
   * 
   * @returns Map of plugin names to their adapters
   */
  getAllAdapters(): Map<string, PluginModelAdapter> {
    return new Map(this.adapters);
  }
  
  /**
   * Remove an adapter for a plugin
   * 
   * @param pluginName The unique name of the plugin
   * @returns True if the adapter was removed
   */
  removeAdapter(pluginName: string): boolean {
    return this.adapters.delete(pluginName);
  }
  
  /**
   * Clear all adapters
   */
  clear(): void {
    this.adapters.clear();
  }
}