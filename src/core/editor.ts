import { h, VNode, patch } from './virtualDom';
import { TextFormattingPlugin } from '../plugins/textFormatting';
import { SelectionManager } from './selection';
import { ContentModel } from '../types/contentModel';
import { Plugin } from './plugin';

export class Editor {
  private container: HTMLElement;
  private vdom: VNode;
  private content: ContentModel = { type: 'document', parent: null, children: [] };
  private plugins: Plugin[];
  private selectionManager: SelectionManager;
  private formattingPlugin: TextFormattingPlugin;
  private eventListeners: { element: EventTarget; type: string; listener: EventListener }[] = [];
  private contentElement: HTMLElement | null = null;

  constructor(element: HTMLElement) {
    console.log('Editor constructor called with element:', element);
    this.container = element;
    
    // Apply container class and force full width
    this.container.classList.add('openrte-container');
    this.applyContainerStyles();
    
    this.selectionManager = new SelectionManager(element);
    
    // Initialize plugins
    this.formattingPlugin = new TextFormattingPlugin(element);
    this.plugins = [this.formattingPlugin];
    
    // Create and patch initial DOM
    this.vdom = this.createEditorDOM();
    
    // Actually render the editor to the DOM
    console.log('Patching container with editor VDOM');
    patch(element, this.vdom);
    
    // Initialize plugins
    this.plugins.forEach(plugin => plugin.init(this));
    
    // Store reference to content element for direct access
    this.contentElement = element.querySelector('.openrte-content');
    
    // Apply direct styles to ensure proper appearance
    if (this.contentElement) {
      this.applyContentStyles(this.contentElement as HTMLElement);
    }
    
    // Initialize event listeners
    this.initializeEventListeners();
    
    // Insert initial paragraph if empty
    setTimeout(() => {
      this.ensureContent();
    }, 0);
  }
  
  private applyContainerStyles(): void {
    // Apply styles directly to the container
    Object.assign(this.container.style, {
      width: '100%',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    });
  }
  
  private applyContentStyles(element: HTMLElement): void {
    // Apply styles directly to the content area
    Object.assign(element.style, {
      minHeight: '200px',
      height: '300px',
      padding: '16px',
      fontFamily: 'sans-serif',
      lineHeight: '1.5',
      flexGrow: '1',
      overflowY: 'auto',
      border: 'none',
      outline: 'none',
      backgroundColor: 'white',
      color: '#333' // Explicitly set text color
    });
  }
  
  private ensureContent(): void {
    if (this.contentElement && !this.contentElement.innerHTML.trim()) {
      const p = document.createElement('p');
      p.style.color = '#333'; // Explicitly set paragraph text color
      p.style.backgroundColor = 'transparent';
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
    // Add key events to the content area, not the container
    const contentArea = this.container.querySelector('.openrte-content');
    if (contentArea) {
      this.addEventHandler(contentArea as HTMLElement, 'keydown', this.handleKeyDown);
      this.addEventHandler(contentArea as HTMLElement, 'input', this.handleInput);
      
      // Make sure the content area is editable
      (contentArea as HTMLElement).contentEditable = 'true';
      
      // Add paste event listener to handle pasted content formatting
      this.addEventHandler(contentArea as HTMLElement, 'paste', this.handlePaste);
      
      console.log('Event listeners added to content area:', contentArea);
    } else {
      console.error('Content area not found for event listeners');
    }
    
    // Add direct event listeners to buttons
    setTimeout(() => {
      this.addDirectButtonListeners();
    }, 100);
  }
  
  private handlePaste = (event: ClipboardEvent): void => {
    // Prevent the default paste behavior
    event.preventDefault();
    
    // Get plain text from clipboard
    const text = event.clipboardData?.getData('text/plain');
    
    if (text) {
      // Insert the text at the current cursor position
      document.execCommand('insertText', false, text);
    }
  };
  
  private addDirectButtonListeners(): void {
    const buttons = this.container.querySelectorAll('button');
    
    buttons.forEach(button => {
      const text = button.textContent?.trim();
      
      console.log('Adding direct event listener to button:', text);
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Button ${text} clicked directly`);
        
        if (text === 'B') {
          this.formattingPlugin.executeBold();
        } else if (text === 'I') {
          this.formattingPlugin.executeItalic();
        } else if (text === 'U') {
          this.formattingPlugin.executeUnderline();
        }
      });
    });
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
    return h('div', { 
      class: 'openrte-editor',
      style: `
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 100%;
        min-width: 300px;
        max-width: 100%;
        margin: 0 auto;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        background-color: #f8f8f8;
      `
    }, [
      this.createToolbar(),
      this.createContentArea()
    ]);
  }

  private createToolbar(): VNode {
    return h('div', { 
      class: 'openrte-toolbar',
      style: `
        padding: 8px;
        border-bottom: 1px solid #ddd;
        display: flex;
        gap: 4px;
        background-color: #f8f8f8;
        flex-shrink: 0;
      `
    }, this.formattingPlugin.createToolbar());
  }

  private createContentArea(): VNode {
    return h('div', { 
      class: 'openrte-content',
      contenteditable: 'true',
      style: `
        min-height: 200px;
        height: 300px;
        padding: 16px;
        font-family: sans-serif;
        line-height: 1.5;
        flex-grow: 1;
        overflow-y: auto;
        border: none;
        outline: none;
        background-color: white;
        color: #333;
      `
    }, ['']);
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
    // Fix any elements that might have been added with incorrect styling
    this.fixTextStyling();
    console.log('Input event detected');
  };
  
  private fixTextStyling(): void {
    if (!this.contentElement) return;
    
    // Ensure all text elements have proper styling
    const textElements = this.contentElement.querySelectorAll('p, div, span');
    textElements.forEach(el => {
      (el as HTMLElement).style.backgroundColor = 'transparent';
      (el as HTMLElement).style.color = '#333';
    });
  }

  setContent(content: ContentModel): void {
    this.content = content;
    // Update content area directly instead of re-rendering the whole editor
    // This prevents button event handlers from being lost
    const contentArea = this.container.querySelector('.openrte-content');
    if (contentArea) {
      // Implementation depends on content model serialization
      // For now, just a placeholder
      contentArea.innerHTML = JSON.stringify(content);
      this.fixTextStyling();
    }
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
    
    // Clear container
    if (this.contentElement) {
      this.contentElement.contentEditable = 'false';
    }
  }
}