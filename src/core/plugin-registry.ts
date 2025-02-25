import { Plugin } from '../types/plugin';
import { Editor } from './editor';

export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  
  // Register a plugin
  register(plugin: Plugin): void {
    this.plugins.set(plugin.getName(), plugin);
  }
  
  // Get a plugin by name
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
  
  // Get all plugins
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  // Get all toolbar controls from plugins
  getToolbarControls(): HTMLElement[] {
    return this.getAllPlugins().map(plugin => plugin.createToolbarControl());
  }
  
  // Initialize all plugins
  initAll(editor: Editor): void {
    this.getAllPlugins().forEach(plugin => plugin.init(editor));
  }
  
  // Destroy all plugins
  destroyAll(): void {
    this.getAllPlugins().forEach(plugin => plugin.destroy());
  }
}