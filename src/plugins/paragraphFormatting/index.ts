import { Plugin } from '../../core/plugin';
import { Editor } from '../../core/editor';
import { createButton } from '../../ui/button';
import { createHeadingSelector } from '../../ui/headingSelector';
import { VNode } from '../../core/virtualDom';
import { SelectionManager } from '../../core/selection';

export class ParagraphFormattingPlugin implements Plugin {
  protected commands: { [key: string]: (value?: string) => void };
  private editor: HTMLElement;
  private selectionManager: SelectionManager;

  constructor(editor: HTMLElement) {
    this.editor = editor;
    this.selectionManager = new SelectionManager(editor);
    
    // Define commands with bound this context
    this.commands = {
      alignLeft: this.setAlignment.bind(this, 'left'),
      alignCenter: this.setAlignment.bind(this, 'center'),
      alignRight: this.setAlignment.bind(this, 'right'),
      orderedList: this.toggleList.bind(this, 'ol'),
      unorderedList: this.toggleList.bind(this, 'ul'),
      heading: this.setHeading.bind(this),
      blockquote: this.toggleBlockquote.bind(this),
      insertLink: this.insertLink.bind(this)
    };
    
    console.log('ParagraphFormattingPlugin constructor completed');
  }

  // Public methods to access commands
  public executeAlignLeft(): void {
    console.log('executeAlignLeft called');
    this.commands.alignLeft();
  }

  public executeAlignCenter(): void {
    console.log('executeAlignCenter called');
    this.commands.alignCenter();
  }

  public executeAlignRight(): void {
    console.log('executeAlignRight called');
    this.commands.alignRight();
  }

  public executeOrderedList(): void {
    console.log('executeOrderedList called');
    this.commands.orderedList();
  }

  public executeUnorderedList(): void {
    console.log('executeUnorderedList called');
    this.commands.unorderedList();
  }

  public executeHeading(level: string = 'h2'): void {
    console.log(`executeHeading called with level ${level}`);
    this.commands.heading(level);
  }

  public executeBlockquote(): void {
    console.log('executeBlockquote called');
    this.commands.blockquote();
  }

  public executeInsertLink(): void {
    console.log('executeInsertLink called');
    this.commands.insertLink();
  }

  init(editor: Editor): void {
    console.log('ParagraphFormattingPlugin initialized with editor', editor);
    
    // Add direct event listeners
    setTimeout(() => {
      this.attachDirectEventListeners();
    }, 100);
  }

  private attachDirectEventListeners(): void {
    const buttons = Array.from(this.editor.querySelectorAll('button'));
    console.log('Found buttons for paragraph formatting:', buttons);
    
    // Map button titles to commands
    const commandMap: { [key: string]: () => void } = {
      'Align Left': this.executeAlignLeft.bind(this),
      'Align Center': this.executeAlignCenter.bind(this),
      'Align Right': this.executeAlignRight.bind(this),
      'Ordered List': this.executeOrderedList.bind(this),
      'Unordered List': this.executeUnorderedList.bind(this),
      'Blockquote': this.executeBlockquote.bind(this),
      'Insert Link': this.executeInsertLink.bind(this)
    };
    
    buttons.forEach(button => {
      const title = button.getAttribute('title');
      if (title && commandMap[title]) {
        console.log(`Attaching direct event to ${title} button`);
        button.addEventListener('click', (e) => {
          e.preventDefault();
          console.log(`${title} button clicked directly`);
          commandMap[title]();
        });
      }
    });

    // Add event listeners for headings dropdown if present
    const headingSelect = this.editor.querySelector('select[data-command="heading"]');
    if (headingSelect) {
      headingSelect.addEventListener('change', (e) => {
        e.preventDefault();
        const value = (e.target as HTMLSelectElement).value;
        console.log(`Heading changed to ${value}`);
        this.executeHeading(value);
      });
    }
  }

  createToolbar(): VNode[] {
    console.log('Creating paragraph formatting toolbar buttons');
    return [
      // Alignment buttons
      createButton('Align Left', (e) => {
        e.preventDefault();
        console.log('Align Left button clicked');
        this.executeAlignLeft();
      }, {
        icon: 'alignLeft',
        title: 'Align Left',
        className: 'openrte-button-align-left'
      }),
      createButton('Align Center', (e) => {
        e.preventDefault();
        console.log('Align Center button clicked');
        this.executeAlignCenter();
      }, {
        icon: 'alignCenter',
        title: 'Align Center',
        className: 'openrte-button-align-center'
      }),
      createButton('Align Right', (e) => {
        e.preventDefault();
        console.log('Align Right button clicked');
        this.executeAlignRight();
      }, {
        icon: 'alignRight',
        title: 'Align Right',
        className: 'openrte-button-align-right'
      }),
      
      // List buttons
      createButton('Ordered List', (e) => {
        e.preventDefault();
        console.log('Ordered List button clicked');
        this.executeOrderedList();
      }, {
        icon: 'listOrdered',
        title: 'Ordered List',
        className: 'openrte-button-ordered-list'
      }),
      createButton('Unordered List', (e) => {
        e.preventDefault();
        console.log('Unordered List button clicked');
        this.executeUnorderedList();
      }, {
        icon: 'listUnordered',
        title: 'Unordered List',
        className: 'openrte-button-unordered-list'
      }),
      
      // Heading selector
      createHeadingSelector((value) => {
        console.log('Heading changed to', value);
        this.executeHeading(value);
      }),
      
      // Blockquote button
      createButton('Blockquote', (e) => {
        e.preventDefault();
        console.log('Blockquote button clicked');
        this.executeBlockquote();
      }, {
        icon: 'blockquote',
        title: 'Blockquote',
        className: 'openrte-button-blockquote'
      }),
      
      // Link button
      createButton('Insert Link', (e) => {
        e.preventDefault();
        console.log('Link button clicked');
        this.executeInsertLink();
      }, {
        icon: 'link',
        title: 'Insert Link',
        className: 'openrte-button-link'
      })
    ];
  }

  destroy(): void {
    this.commands = {};
  }

  private setAlignment(alignment: 'left' | 'center' | 'right'): void {
    console.log(`Setting alignment: ${alignment}`);
    const selection = window.getSelection();
    if (!selection?.rangeCount) {
      console.log('No selection found');
      return;
    }
    
    // Get the current paragraph
    let currentNode = selection.anchorNode;
    
    // Find the closest paragraph or block element
    let blockElement: HTMLElement | null = null;
    while (currentNode && currentNode !== this.editor) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        // Check if it's a block element we can align
        if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'li'].includes(tagName)) {
          blockElement = element;
          break;
        }
      }
      currentNode = currentNode.parentNode;
    }

    if (blockElement) {
      blockElement.style.textAlign = alignment;
    } else {
      // No block element found, wrap selection in a paragraph with alignment
      this.wrapInElement('p', { style: `text-align: ${alignment};` });
    }
  }

  private toggleList(listType: 'ol' | 'ul'): void {
    console.log(`Toggling list: ${listType}`);
    const selection = window.getSelection();
    if (!selection?.rangeCount) {
      console.log('No selection found');
      return;
    }
    
    // Check if we're already in a list of this type
    let currentNode = selection.anchorNode;
    let inList = false;
    let existingList: HTMLElement | null = null;
    
    while (currentNode && currentNode !== this.editor) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        if (element.tagName.toLowerCase() === listType) {
          inList = true;
          existingList = element;
          break;
        }
      }
      currentNode = currentNode.parentNode;
    }
    
    if (inList && existingList) {
      // We're already in a list, convert to paragraphs
      this.convertListToParagraphs(existingList);
    } else {
      // Not in a list, convert to list
      this.convertSelectionToList(listType);
    }
  }

  private convertSelectionToList(listType: 'ol' | 'ul'): void {
    // Get current selection
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // Create new list
    const list = document.createElement(listType);
    
    // Check if selection spans multiple paragraphs
    let currentNode: Node | null = range.startContainer;
    let parentNode: Node | null = null;
    
    // Find the common parent that contains the entire selection
    while (currentNode && currentNode !== this.editor) {
      if (range.commonAncestorContainer === currentNode) {
        parentNode = currentNode;
        break;
      }
      currentNode = currentNode.parentNode;
    }
    
    if (!parentNode) return;
    
    // If the selection is within a single text node, wrap it in a list item
    if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
      const content = range.extractContents();
      const li = document.createElement('li');
      li.appendChild(content);
      list.appendChild(li);
      range.insertNode(list);
      return;
    }
    
    // For multiple paragraphs, convert each to a list item
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(range.extractContents());
    
    const paragraphs = tempDiv.querySelectorAll('p');
    
    if (paragraphs.length > 0) {
      // Convert each paragraph to a list item
      paragraphs.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = p.innerHTML;
        list.appendChild(li);
      });
    } else {
      // No paragraphs found, create a single list item with all content
      const li = document.createElement('li');
      li.innerHTML = tempDiv.innerHTML;
      list.appendChild(li);
    }
    
    range.insertNode(list);
  }

  private convertListToParagraphs(list: HTMLElement): void {
    const fragment = document.createDocumentFragment();
    const items = list.querySelectorAll('li');
    
    items.forEach(item => {
      const p = document.createElement('p');
      p.innerHTML = item.innerHTML;
      fragment.appendChild(p);
    });
    
    list.parentNode?.replaceChild(fragment, list);
  }

  private setHeading(level: string = 'h2'): void {
    console.log(`Setting heading: ${level}`);
    
    // Remove existing heading if any
    this.removeExistingHeading();
    
    // Create new heading
    this.wrapInElement(level);
  }

  private removeExistingHeading(): void {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    
    let currentNode: Node | null = selection.anchorNode;
    
    // Find existing heading
    while (currentNode && currentNode !== this.editor) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          // Unwrap the heading (convert to paragraph)
          const p = document.createElement('p');
          p.innerHTML = element.innerHTML;
          element.parentNode?.replaceChild(p, element);
          return;
        }
      }
      currentNode = currentNode.parentNode;
    }
  }

  private toggleBlockquote(): void {
    console.log('Toggling blockquote');
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    
    // Check if already in blockquote
    let currentNode: Node | null = selection.anchorNode;
    let inBlockquote = false;
    let blockquoteElement: HTMLElement | null = null;
    
    while (currentNode && currentNode !== this.editor) {
      if (currentNode.nodeType === Node.ELEMENT_NODE && 
          (currentNode as HTMLElement).tagName.toLowerCase() === 'blockquote') {
        inBlockquote = true;
        blockquoteElement = currentNode as HTMLElement;
        break;
      }
      currentNode = currentNode.parentNode;
    }
    
    if (inBlockquote && blockquoteElement) {
      // Unwrap blockquote
      const p = document.createElement('p');
      p.innerHTML = blockquoteElement.innerHTML;
      blockquoteElement.parentNode?.replaceChild(p, blockquoteElement);
    } else {
      // Wrap in blockquote
      this.wrapInElement('blockquote', { 
        style: 'border-left: 4px solid #ccc; padding-left: 16px; margin-left: 0; font-style: italic;' 
      });
    }
  }

  private insertLink(): void {
    console.log('Inserting link');
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // If range is collapsed, prompt for link text too
    let linkText = '';
    if (range.collapsed) {
      linkText = prompt('Enter link text:', '') || '';
      if (!linkText) return; // User cancelled
    } else {
      // Use selected text
      linkText = range.toString();
    }
    
    // Prompt for URL
    const url = prompt('Enter URL:', 'https://') || '';
    if (!url) return; // User cancelled
    
    // Create link
    const link = document.createElement('a');
    link.href = url;
    link.textContent = linkText;
    
    // If range was collapsed, just insert the link
    if (range.collapsed) {
      range.insertNode(link);
    } else {
      // Replace selection with link
      range.deleteContents();
      range.insertNode(link);
    }
    
    // Update selection
    const newRange = document.createRange();
    newRange.setStartAfter(link);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  private wrapInElement(tagName: string, attributes: { [key: string]: string } = {}): void {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    try {
      // Extract content
      const content = range.extractContents();
      
      // Create element
      const element = document.createElement(tagName);
      
      // Apply attributes
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      
      // Add content
      element.appendChild(content);
      
      // Insert element
      range.insertNode(element);
      
      // Update selection
      const newRange = document.createRange();
      newRange.setStartAfter(element);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } catch (error) {
      console.error('Error wrapping in element:', error);
    }
  }
}