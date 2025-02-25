// src/core/editor.ts
import { TextFormattingPlugin } from '../plugins/textFormatting';
import { SelectionManager } from './selection';
import { ContentModel } from '../types/contentModel';
import { Plugin } from './plugin';
import { serializeToHtml } from './serializer';

export class Editor {
  private container: HTMLElement;
  private content: ContentModel = { type: 'document', parent: null, children: [] };
  private plugins: Plugin[];
  private selectionManager: SelectionManager;
  private formattingPlugin: TextFormattingPlugin;
  private eventListeners: { element: EventTarget; type: string; listener: EventListener }[] = [];
  private contentElement: HTMLElement | null = null;
  private toolbarElement: HTMLElement | null = null;

  constructor(element: HTMLElement) {
    console.log('Editor constructor called with element:', element);
    this.container = element;
    
    // Apply container class
    this.container.classList.add('openrte-container');
    
    this.selectionManager = new SelectionManager(element);
    
    // Initialize plugins
    this.formattingPlugin = new TextFormattingPlugin(element);
    this.plugins = [this.formattingPlugin];
    
    // Create DOM structure
    this.createEditorDOM();
    
    // Initialize plugins
    this.plugins.forEach(plugin => plugin.init(this));
    
    // Initialize event listeners
    this.initializeEventListeners();
    
    // Insert initial paragraph if empty
    setTimeout(() => {
      this.ensureContent();
    }, 0);
  }
  
  private ensureContent(): void {
    if (this.contentElement && !this.contentElement.innerHTML.trim()) {
      const p = document.createElement('p');
      p.innerHTML = '&nbsp;'; // Non-breaking space to ensure the paragraph has content
      this.contentElement.appendChild(p);
      
      // Place cursor in the paragraph
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.setStart(p, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  private initializeEventListeners(): void {
    if (this.contentElement) {
      this.addEventHandler(this.contentElement, 'keydown', this.handleKeyDown);
      this.addEventHandler(this.contentElement, 'input', this.handleInput);
      console.log('Event listeners added to content area:', this.contentElement);
    } else {
      console.error('Content area not found for event listeners');
    }
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

  private createEditorDOM(): void {
    // Clear container first
    this.container.innerHTML = '';
    
    // Create main editor container
    const editorElement = document.createElement('div');
    editorElement.className = 'openrte-editor';
    
    // Create toolbar
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = 'openrte-toolbar';
    
    // Create content area
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'openrte-content';
    this.contentElement.contentEditable = 'true';
    this.contentElement.style.minHeight = '200px';
    this.contentElement.style.height = '300px';
    this.contentElement.style.padding = '16px';
    this.contentElement.style.flexGrow = '1';
    this.contentElement.style.overflowY = 'auto';
    
    // Add formatting buttons to toolbar
    this.formattingPlugin.createToolbar(this.toolbarElement);
    
    // Append elements to DOM
    editorElement.appendChild(this.toolbarElement);
    editorElement.appendChild(this.contentElement);
    this.container.appendChild(editorElement);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      switch(event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          console.log('Ctrl+B keyboard shortcut detected');
          this.formattingPlugin.executeBold();
          break;
        case 'i':
          event.preventDefault();
          console.log('Ctrl+I keyboard shortcut detected');
          this.formattingPlugin.executeItalic();
          break;
        case 'u':
          event.preventDefault();
          console.log('Ctrl+U keyboard shortcut detected');
          this.formattingPlugin.executeUnderline();
          break;
      }
    }
  };

  private handleInput = (): void => {
    // Capture content changes here if needed
    console.log('Input event detected');
    // Could update this.content based on DOM content
  };

  setContent(content: ContentModel): void {
    this.content = content;
    
    if (this.contentElement) {
      // Convert content model to HTML and set
      const html = serializeToHtml(content);
      this.contentElement.innerHTML = html;
    }
  }

  getContent(): ContentModel {
    // In a real implementation, we would parse the DOM back to our content model
    // For now, we'll just return the stored model
    return this.content;
  }

  getHtml(): string {
    return this.contentElement ? this.contentElement.innerHTML : '';
  }

  destroy(): void {
    // Clean up plugins
    this.plugins.forEach(plugin => plugin.destroy());
    
    // Remove all event listeners
    this.eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener);
    });
    this.eventListeners = [];
    
    // Clear container
    if (this.contentElement) {
      this.contentElement.contentEditable = 'false';
    }
    
    // Clear DOM
    this.container.innerHTML = '';
  }
}