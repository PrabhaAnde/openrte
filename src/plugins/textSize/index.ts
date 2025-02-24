import { Plugin } from '../../core/plugin';
import { Editor } from '../../core/editor';
import { createButton } from '../../ui/button';
import { h, VNode } from '../../core/virtualDom';
import { SelectionManager } from '../../core/selection';
import { createIcon } from '../../ui/icon';

export class TextSizePlugin implements Plugin {
  private editor: HTMLElement;
  private selectionManager: SelectionManager;
  
  // Default font sizes in pixels
  private readonly fontSizes = {
    'Small': '12px',
    'Normal': '16px',
    'Medium': '18px',
    'Large': '24px',
    'XL': '32px'
  };

  constructor(editor: HTMLElement) {
    this.editor = editor;
    this.selectionManager = new SelectionManager(editor);
    console.log('TextSizePlugin constructor completed');
  }

  init(editor: Editor): void {
    console.log('TextSizePlugin initialized with editor', editor);
    
    // Add direct event listeners
    setTimeout(() => {
      this.attachDirectEventListeners();
    }, 100);
  }

  private attachDirectEventListeners(): void {
    // Add event listener to the font size dropdown if present
    const sizeSelect = this.editor.querySelector('select[data-command="fontSize"]');
    if (sizeSelect) {
      sizeSelect.addEventListener('change', (e) => {
        e.preventDefault();
        const value = (e.target as HTMLSelectElement).value;
        console.log(`Font size changed to ${value}`);
        this.setFontSize(value);
      });
    }
  }

  public setFontSize(size: string): void {
    console.log(`Setting font size: ${size}`);
    const selection = window.getSelection();
    if (!selection?.rangeCount) {
      console.log('No selection found');
      return;
    }
    
    const range = selection.getRangeAt(0);
    
    // If no text is selected, return
    if (range.collapsed) {
      console.log('Range is collapsed, cannot format empty selection');
      return;
    }
    
    try {
      // Create a span with font-size style
      const span = document.createElement('span');
      span.style.fontSize = (this.fontSizes as Record<string, string>)[size] || size;
      
      // Wrap the selection with the span
      range.surroundContents(span);
    } catch (error) {
      console.error('Error applying font size:', error);
      
      // Fallback for complex selections
      const fragment = range.extractContents();
      const span = document.createElement('span');
      span.style.fontSize = (this.fontSizes as Record<string, string>)[size] || size;
      span.appendChild(fragment);
      range.insertNode(span);
    }
  }
  createToolbar(): VNode[] {
    console.log('Creating text size toolbar controls');
    
    // Create font size dropdown with icon
    const fontSizeOptions = Object.keys(this.fontSizes).map(size => {
      return h('option', { value: size }, [size]);
    });
    
    // Font size icon
    const fontSizeIcon = createIcon('fontSize', { 
      width: '16', 
      height: '16',
      className: 'openrte-icon-font-size'
    });
    
    // Wrapper to contain both icon and dropdown
    return [
      h('div', { 
        class: 'openrte-toolbar-control openrte-font-size-control',
        style: 'display: flex; align-items: center; margin: 2px;'
      }, [
        // Icon container
        h('div', { 
          class: 'openrte-toolbar-icon-container',
          style: 'margin-right: 4px; display: flex; align-items: center;'
        }, [fontSizeIcon]),
        // Dropdown
        h('select', { 
          'data-command': 'fontSize',
          style: 'padding: 4px; border: 1px solid #ccc; border-radius: 3px;',
          title: 'Font Size',
          onchange: (e: Event) => {
            e.preventDefault();
            const select = e.target as HTMLSelectElement;
            this.setFontSize(select.value);
          }
        }, [
          h('option', { value: '', disabled: true, selected: true }, ['Size']),
          ...fontSizeOptions
        ])
      ])
    ];
  }

  destroy(): void {
    // Cleanup
  }
}