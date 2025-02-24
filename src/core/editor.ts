import { h, VNode, patch } from './virtualDom';
import { TextFormattingPlugin } from '../plugins/textFormatting';
import { ParagraphFormattingPlugin } from '../plugins/paragraphFormatting';
import { TextSizePlugin } from '../plugins/textSize';
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
  private paragraphPlugin: ParagraphFormattingPlugin;
  private textSizePlugin: TextSizePlugin;
  private eventListeners: { element: EventTarget; type: string; listener: EventListener }[] = [];
  private contentElement: HTMLElement | null = null;

  constructor(element: HTMLElement) {
    console.log('Editor constructor called with element:', element);
    this.container = element;
    
    // Apply container class
    this.container.classList.add('openrte-container');
    
    this.selectionManager = new SelectionManager(element);
    
    // Initialize plugins
    this.formattingPlugin = new TextFormattingPlugin(element);
    this.paragraphPlugin = new ParagraphFormattingPlugin(element);
    this.textSizePlugin = new TextSizePlugin(element);
    this.plugins = [
      this.formattingPlugin,
      this.paragraphPlugin,
      this.textSizePlugin
    ];
    
    // Create and patch initial DOM
    this.vdom = this.createEditorDOM();
    
    // Actually render the editor to the DOM
    console.log('Patching container with editor VDOM');
    patch(element, this.vdom);
    
    // Initialize plugins
    this.plugins.forEach(plugin => plugin.init(this));
    
    // Store reference to content element for direct access
    this.contentElement = element.querySelector('.openrte-content');
    
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
    // Add key events to the content area, not the container
    const contentArea = this.container.querySelector('.openrte-content');
    if (contentArea) {
      this.addEventHandler(contentArea as HTMLElement, 'keydown', this.handleKeyDown);
      this.addEventHandler(contentArea as HTMLElement, 'input', this.handleInput);
      
      // Make sure the content area is editable
      (contentArea as HTMLElement).contentEditable = 'true';
      
      console.log('Event listeners added to content area:', contentArea);
    } else {
      console.error('Content area not found for event listeners');
    }
    
    // Add direct event listeners to buttons
    setTimeout(() => {
      this.addDirectButtonListeners();
    }, 100);
  }
  
  private addDirectButtonListeners(): void {
    const buttons = this.container.querySelectorAll('button');
    
    buttons.forEach(button => {
      const text = button.textContent?.trim();
      
      console.log('Adding direct event listener to button:', text);
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Button ${text} clicked directly`);
        
        // Text formatting commands
        if (text === 'B') {
          this.formattingPlugin.executeBold();
        } else if (text === 'I') {
          this.formattingPlugin.executeItalic();
        } else if (text === 'U') {
          this.formattingPlugin.executeUnderline();
        }
        // Paragraph formatting commands
        else if (text === 'L') {
          this.paragraphPlugin.executeAlignLeft();
        } else if (text === 'C') {
          this.paragraphPlugin.executeAlignCenter();
        } else if (text === 'R') {
          this.paragraphPlugin.executeAlignRight();
        } else if (text === 'OL') {
          this.paragraphPlugin.executeOrderedList();
        } else if (text === 'UL') {
          this.paragraphPlugin.executeUnorderedList();
        } else if (text === 'H') {
          this.paragraphPlugin.executeHeading();
        } else if (text === 'BQ') {
          this.paragraphPlugin.executeBlockquote();
        } else if (text === 'Link') {
          this.paragraphPlugin.executeInsertLink();
        }
      });
    });

    // Add listeners for select elements (font size, headings)
    const fontSizeSelect = this.container.querySelector('select[data-command="fontSize"]');
    if (fontSizeSelect) {
      fontSizeSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        this.textSizePlugin.setFontSize(value);
      });
    }

    const headingSelect = this.container.querySelector('select[data-command="heading"]');
    if (headingSelect) {
      headingSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        this.paragraphPlugin.executeHeading(value);
      });
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

  private createEditorDOM(): VNode {
    return h('div', { class: 'openrte-editor' }, [
      this.createToolbar(),
      this.createContentArea()
    ]);
  }

  private createToolbar(): VNode {
    // Toolbar groups for better organization
    const textFormattingGroup = h('div', { 
      class: 'openrte-toolbar-group', 
      style: 'display: flex; gap: 4px; margin-right: 8px; padding-right: 8px; border-right: 1px solid #ddd;'
    }, this.formattingPlugin.createToolbar());
    
    const paragraphFormattingGroup = h('div', { 
      class: 'openrte-toolbar-group',
      style: 'display: flex; gap: 4px; margin-right: 8px; padding-right: 8px; border-right: 1px solid #ddd;'
    }, this.paragraphPlugin.createToolbar());

    const textSizeGroup = h('div', { 
      class: 'openrte-toolbar-group',
      style: 'display: flex; gap: 4px; margin-right: 8px;'
    }, this.textSizePlugin.createToolbar());

    return h('div', { class: 'openrte-toolbar' }, [
      textFormattingGroup,
      paragraphFormattingGroup,
      textSizeGroup
    ]);
  }

  private createContentArea(): VNode {
    return h('div', { 
      class: 'openrte-content',
      contenteditable: 'true',
      style: 'min-height: 200px; height: 300px; padding: 16px; flex-grow: 1; overflow-y: auto;'
    }, ['']);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      switch(event.key.toLowerCase()) {
        // Text formatting shortcuts
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
          
        // List shortcuts
        case '7': // For ordered list (Ctrl+7 or Cmd+7)
          if (event.shiftKey) {
            event.preventDefault();
            console.log('Ctrl+Shift+7 keyboard shortcut detected (ordered list)');
            this.paragraphPlugin.executeOrderedList();
          }
          break;
        case '8': // For bullet list (Ctrl+8 or Cmd+8)
          if (event.shiftKey) {
            event.preventDefault();
            console.log('Ctrl+Shift+8 keyboard shortcut detected (bullet list)');
            this.paragraphPlugin.executeUnorderedList();
          }
          break;
          
        // Link shortcut
        case 'k':
          event.preventDefault();
          console.log('Ctrl+K keyboard shortcut detected (insert link)');
          this.paragraphPlugin.executeInsertLink();
          break;
      }
    }
  };

  private handleInput = (): void => {
    // No need to re-render on input, as we're working with contentEditable
    console.log('Input event detected');
    
    // Here we could update our content model based on the current HTML
    // and trigger onChange callbacks
    this.updateContentModel();
  };
  
  private updateContentModel(): void {
    // This method would parse the HTML content and update the content model
    // This is a placeholder for the actual implementation
    if (this.contentElement) {
      // For now, we'll just create a simple representation
      const document: ContentModel = { 
        type: 'document',
        parent: null,
        children: []
      };
      
      const paragraph: any = {
        type: 'paragraph',
        parent: document,
        children: []
      };
      
      const textRun: any = {
        type: 'text',
        parent: paragraph,
        children: [],
        text: this.contentElement.innerHTML
      };
      
      paragraph.children.push(textRun);
      document.children.push(paragraph);
      
      this.content = document;
    }
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
    }
  }

  getContent(): ContentModel {
    // Update the content model before returning it
    this.updateContentModel();
    return this.content;
  }
  
  // Method to get the HTML content
  getHTML(): string {
    return this.contentElement?.innerHTML || '';
  }
  
  // Method to set HTML content directly
  setHTML(html: string): void {
    if (this.contentElement) {
      this.contentElement.innerHTML = html;
      this.updateContentModel();
    }
  }
  
  // Get plain text content
  getPlainText(): string {
    return this.contentElement?.textContent || '';
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