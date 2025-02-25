import { Editor, Plugin } from '../../index';

export interface OpenRTEConfig {
  // Initial HTML content
  content?: string;
  
  // Additional plugins
  plugins?: Plugin[];
  
  // Editor customization
  height?: string | number;
  width?: string | number;
  
  // Additional class name
  className?: string;
  
  // Placeholder text
  placeholder?: string;
  
  // Read-only mode
  readOnly?: boolean;
  
  // Event callbacks
  onInit?: (editor: Editor) => void;
  onChange?: (html: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * OpenRTE Vanilla JavaScript wrapper
 * 
 * This class provides a simple API for using OpenRTE without a framework.
 */
export class OpenRTEVanilla {
  private element: HTMLElement;
  private editor: Editor | null = null;
  private config: OpenRTEConfig;
  private eventListeners: { element: HTMLElement; type: string; listener: EventListener }[] = [];
  
  /**
   * Creates a new OpenRTE instance
   * 
   * @param elementOrSelector The element or CSS selector to mount the editor
   * @param config Configuration options
   */
  constructor(elementOrSelector: HTMLElement | string, config: OpenRTEConfig = {}) {
    // Find the target element
    if (typeof elementOrSelector === 'string') {
      const targetElement = document.querySelector(elementOrSelector);
      if (!targetElement) {
        throw new Error(`OpenRTE: Element not found for selector "${elementOrSelector}"`);
      }
      this.element = targetElement as HTMLElement;
    } else {
      this.element = elementOrSelector;
    }
    
    // Store config
    this.config = config;
    
    // Initialize the editor
    this.initialize();
  }
  
  /**
   * Initialize the editor
   */
  private async initialize(): Promise<void> {
    // Import the editor dynamically
    const { createEditor } = await import('../../index');
    
    // Create a wrapper element
    const wrapperElement = document.createElement('div');
    wrapperElement.className = 'openrte-vanilla-wrapper';
    
    // Apply styles
    if (this.config.width) {
      wrapperElement.style.width = typeof this.config.width === 'number' 
        ? `${this.config.width}px` : this.config.width;
    }
    if (this.config.height) {
      wrapperElement.style.height = typeof this.config.height === 'number' 
        ? `${this.config.height}px` : this.config.height;
    }
    
    // Add additional class name
    if (this.config.className) {
      wrapperElement.className += ` ${this.config.className}`;
    }
    
    // Append wrapper to the target element
    this.element.appendChild(wrapperElement);
    
    // Create the editor
    this.editor = createEditor(wrapperElement);
    
    // Register additional plugins
    if (this.config.plugins && this.config.plugins.length > 0) {
      this.config.plugins.forEach(plugin => this.editor!.registerPlugin(plugin));
    }
    
    // Set initial content
    if (this.config.content) {
      this.editor.setContent(this.config.content);
    }
    
    // Add event listeners
    this.setupEventListeners();
    
    // Add placeholder if needed
    if (this.config.placeholder) {
      this.addPlaceholder(this.config.placeholder);
    }
    
    // Set read-only mode if needed
    if (this.config.readOnly) {
      this.editor.getContentArea().contentEditable = 'false';
    }
    
    // Call onInit callback
    if (this.config.onInit) {
      this.config.onInit(this.editor);
    }
  }
  
  /**
   * Set up event listeners based on config
   */
  private setupEventListeners(): void {
    if (!this.editor) return;
    
    const contentArea = this.editor.getContentArea();
    
    // Change event
    if (this.config.onChange) {
      const handleChange = () => {
        if (this.editor && this.config.onChange) {
          this.config.onChange(this.editor.getContent());
        }
      };
      
      contentArea.addEventListener('input', handleChange);
      this.addEventHandler(contentArea, 'input', handleChange);
    }
    
    // Focus event
    if (this.config.onFocus) {
      this.addEventHandler(contentArea, 'focus', this.config.onFocus);
    }
    
    // Blur event
    if (this.config.onBlur) {
      this.addEventHandler(contentArea, 'blur', this.config.onBlur);
    }
  }
  
  /**
   * Track event handlers for cleanup
   */
  private addEventHandler(element: HTMLElement, type: string, listener: EventListener): void {
    element.addEventListener(type, listener);
    this.eventListeners.push({ element, type, listener });
  }
  
  /**
   * Add placeholder functionality
   */
  private addPlaceholder(placeholderText: string): void {
    if (!this.editor) return;
    
    const contentArea = this.editor.getContentArea();
    
    // Add placeholder class and data attribute
    contentArea.classList.add('openrte-has-placeholder');
    contentArea.dataset.placeholder = placeholderText;
    
    // Add event listeners to show/hide placeholder
    const togglePlaceholder = () => {
      if (contentArea.textContent?.trim() === '') {
        contentArea.classList.add('openrte-empty');
      } else {
        contentArea.classList.remove('openrte-empty');
      }
    };
    
    // Initial check
    togglePlaceholder();
    
    // Listen for changes
    this.addEventHandler(contentArea, 'input', togglePlaceholder);
    
    // Add CSS for placeholder
    const style = document.createElement('style');
    style.textContent = `
      .openrte-has-placeholder.openrte-empty:before {
        content: attr(data-placeholder);
        color: #999;
        position: absolute;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Get the content of the editor
   */
  public getContent(): string {
    return this.editor ? this.editor.getContent() : '';
  }
  
  /**
   * Set the content of the editor
   */
  public setContent(html: string): void {
    if (this.editor) {
      this.editor.setContent(html);
    }
  }
  
  /**
   * Focus the editor
   */
  public focus(): void {
    if (this.editor) {
      this.editor.focus();
    }
  }
  
  /**
   * Set read-only mode
   */
  public setReadOnly(readOnly: boolean): void {
    if (this.editor) {
      this.editor.getContentArea().contentEditable = readOnly ? 'false' : 'true';
    }
  }
  
  /**
   * Get the underlying editor instance
   */
  public getEditor(): Editor | null {
    return this.editor;
  }
  
  /**
   * Destroy the editor instance and clean up
   */
  public destroy(): void {
    // Remove event listeners
    this.eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener);
    });
    this.eventListeners = [];
    
    // Destroy the editor
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
    
    // Remove the wrapper element
    const wrapper = this.element.querySelector('.openrte-vanilla-wrapper');
    if (wrapper) {
      this.element.removeChild(wrapper);
    }
  }
}