import { h, VNode, patch } from './virtualDom';
import { TextFormattingPlugin } from '../plugins/textFormatting';
import { SelectionManager } from './selection';
import { ContentModel } from '../types/contentModel';
import { Plugin } from './plugin';

export class Editor {
  private container: HTMLElement;
  private vdom: VNode;
  private content: ContentModel = { type: 'document', parent: null, children: [] }; // Initialize with default value
  private plugins: Plugin[];
  private selectionManager: SelectionManager;
  private formattingPlugin: TextFormattingPlugin;
  private eventListeners: { element: EventTarget; type: string; listener: EventListener }[] = [];

  constructor(element: HTMLElement) {
    this.container = element;
    this.selectionManager = new SelectionManager(element);
    
    // Initialize plugins
    this.formattingPlugin = new TextFormattingPlugin(element);
    this.plugins = [this.formattingPlugin];
    
    // Create and patch initial DOM
    this.vdom = this.createEditorDOM();
    patch(element, this.vdom);
    
    this.initializeEventListeners();
  }
  private initializeEventListeners(): void {
    this.addEventHandler(this.container, 'keydown', this.handleKeyDown);
    this.addEventHandler(this.container, 'input', this.handleInput);
  }

  private addEventHandler<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void
  ): void {
    const listener = handler.bind(this) as EventListener;
    element.addEventListener(type, listener);
    this.eventListeners.push({ element, type, listener });
  }

  private createEditorDOM(): VNode {
    return h('div', { class: 'openrte-editor' }, [
      this.createToolbar(),
      this.createContentArea()
    ]);
  }

  private createToolbar(): VNode {
    return h('div', { class: 'openrte-toolbar' }, 
      this.formattingPlugin.createToolbar()
    );
  }

  private createContentArea(): VNode {
    return h('div', { 
      class: 'openrte-content',
      contenteditable: 'true'
    });
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      switch(event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          this.formattingPlugin.executeBold();
          break;
      }
    }
  };

  private handleInput = (): void => {
    this.render();
  };

  private render(): void {
    const newVdom = this.createEditorDOM();
    patch(this.container, newVdom);
    this.vdom = newVdom;
  }

  setContent(content: ContentModel): void {
    this.content = content;
    this.render();
  }

  getContent(): ContentModel {
    return this.content;
  }

  destroy(): void {
    // Clean up plugins
    this.plugins.forEach(plugin => plugin.destroy());
    
    // Remove all event listeners
    this.eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener);
    });
    this.eventListeners = [];
    
    // Reset container
    this.container.contentEditable = 'false';
  }
}