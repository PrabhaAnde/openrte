import { Plugin } from '../../core/plugin';
import { Editor } from '../../core/editor';
import { createButton } from '../../ui/button';
import { VNode } from '../../core/virtualDom';
import { SelectionManager } from '../../core/selection';

export class TextFormattingPlugin implements Plugin {
  // Make commands public instead of protected
  public commands: { [key: string]: () => void };
  private editor: HTMLElement;
  private selectionManager: SelectionManager;
  private buttonDefinitions: { label: string; command: string; title?: string }[] = [];

  constructor(editor: HTMLElement) {
    this.editor = editor;
    this.selectionManager = new SelectionManager(editor);
    
    // Define commands with bound this context to avoid issues
    this.commands = {
      'bold': this.toggleFormat.bind(this, 'strong'),
      'italic': this.toggleFormat.bind(this, 'em'),
      'underline': this.toggleFormat.bind(this, 'u')
    };
    
    // Define button definitions - make sure the commands match exactly the keys in the commands object
    this.buttonDefinitions = [
      { label: 'B', command: 'bold', title: 'Bold (Ctrl+B)' },
      { label: 'I', command: 'italic', title: 'Italic (Ctrl+I)' },
      { label: 'U', command: 'underline', title: 'Underline (Ctrl+U)' }
    ];
    
    // Add shortcuts for capitalized command names to handle case sensitivity issues
    this.commands['Bold'] = this.commands['bold'];
    this.commands['Italic'] = this.commands['italic'];
    this.commands['Underline'] = this.commands['underline'];
    
    // Add shortcuts for B, I, U to handle direct command cases
    this.commands['b'] = this.commands['bold'];
    this.commands['i'] = this.commands['italic'];
    this.commands['u'] = this.commands['underline'];
    
    console.log('TextFormattingPlugin constructor completed, available commands:', Object.keys(this.commands));
  }

  // Generic command execution method
  public executeCommand(commandName: string): void {
    // If commandName is undefined or null, default to empty string
    const inputCommand = commandName || '';
    
    // Try various forms of the command
    // 1. Try as-is
    // 2. Try lowercase
    // 3. Try single-letter version
    const possibleCommands = [
      inputCommand,
      inputCommand.toLowerCase(),
      inputCommand.charAt(0).toLowerCase()
    ];
    
    // Try to find a matching command
    let foundCommand = false;
    for (const cmd of possibleCommands) {
      if (cmd in this.commands) {
        console.log(`Executing command: ${cmd}`);
        this.commands[cmd]();
        foundCommand = true;
        break;
      }
    }
    
    if (!foundCommand) {
      console.warn(`Command not found: ${inputCommand}, available commands:`, Object.keys(this.commands));
      
      // Print all the commands for debugging
      console.log('Command object dump:', this.commands);
      
      // For single letter commands like 'i', try to map to full commands
      const letterToCommand: Record<string, string> = {
        'b': 'bold',
        'i': 'italic',
        'u': 'underline'
      };
      
      // If it's a single letter, try the mapped version
      if (inputCommand.length === 1 && inputCommand in letterToCommand) {
        const mappedCommand = letterToCommand[inputCommand];
        if (mappedCommand in this.commands) {
          console.log(`Found mapped command ${mappedCommand} for letter ${inputCommand}`);
          this.commands[mappedCommand]();
          return;
        }
      }
    }
  }

  // Public methods for specific commands (for backward compatibility)
  public executeBold(): void {
    this.executeCommand('bold');
  }

  public executeItalic(): void {
    this.executeCommand('italic');
  }

  public executeUnderline(): void {
    this.executeCommand('underline');
  }

  // Get keyboard shortcuts mapping
  public getKeyboardShortcuts(): { [key: string]: string } {
    return {
      'b': 'bold',
      'i': 'italic',
      'u': 'underline'
    };
  }

  init(editor: Editor): void {
    // Initialize plugin
    console.log('TextFormattingPlugin initialized with editor', editor);
    
    // Add direct event listeners to ensure they work
    setTimeout(() => {
      this.attachDirectEventListeners();
    }, 100);
  }

  private attachDirectEventListeners(): void {
    // Find the buttons by their text/labels
    const buttons = Array.from(this.editor.querySelectorAll('button'));
    console.log('Found buttons:', buttons);
    
    // Map button labels to command names
    const buttonCommandMap: Record<string, string> = {};
    this.buttonDefinitions.forEach(def => {
      buttonCommandMap[def.label] = def.command;
    });
    
    // Also map lowercase versions of labels
    for (const label in buttonCommandMap) {
      buttonCommandMap[label.toLowerCase()] = buttonCommandMap[label];
    }
    
    buttons.forEach(button => {
      const text = button.textContent?.trim() || '';
      const command = buttonCommandMap[text] || buttonCommandMap[text.toLowerCase()];
      
      if (command) {
        console.log(`Attaching direct event to ${text} button for command ${command}`);
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`${text} button clicked directly, executing ${command}`);
          this.executeCommand(command);
        });
      } else {
        console.warn(`No command found for button: ${text}`);
      }
    });
  }

  createToolbar(): VNode[] {
    console.log('Creating toolbar buttons');
    
    // Create buttons based on button definitions
    return this.buttonDefinitions.map(def => {
      const button = createButton(def.label, (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`${def.label} button clicked via virtual DOM, executing ${def.command}`);
        this.executeCommand(def.command);
      }, def.title || '');
      
      // Add a data attribute with the exact command name to help with debugging
      button.props['data-command-exact'] = def.command;
      
      return button;
    });
  }

  destroy(): void {
    // Don't empty the commands object as it might be needed by other code
    // Instead, just log that we're destroying the plugin
    console.log('TextFormattingPlugin being destroyed');
  }

  private toggleFormat(tag: string): void {
    console.log(`Toggling format: ${tag}`);
    const selection = window.getSelection();
    if (!selection?.rangeCount) {
      console.log('No selection found');
      return;
    }
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      console.log('Range is collapsed, cannot format empty selection');
      return;
    }

    try {
      // Check if we're already in this format
      if (this.isFormatActive(tag)) {
        console.log(`Format ${tag} is active, removing it`);
        this.unwrapFormat(range, tag);
      } else {
        console.log(`Format ${tag} is not active, applying it`);
        const element = document.createElement(tag);
        range.surroundContents(element);
      }
    } catch (error) {
      console.error('Error applying format:', error);
      
      // Fallback approach for complex selections
      const documentFragment = range.extractContents();
      const element = document.createElement(tag);
      element.appendChild(documentFragment);
      range.insertNode(element);
      
      // Cleanup empty format elements
      this.cleanupEmptyNodes(this.editor);
    }
  }

  private isFormatActive(tagName: string): boolean {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;
    
    let node: Node | null = selection.anchorNode;
    while (node && node !== this.editor) {
      if (node.nodeType === Node.ELEMENT_NODE && 
          (node as Element).tagName.toLowerCase() === tagName.toLowerCase()) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  private unwrapFormat(range: Range, tagName: string): void {
    let node: Node | null = range.commonAncestorContainer;
    
    // Find the formatting element
    while (node && node !== this.editor) {
      if (node.nodeType === Node.ELEMENT_NODE && 
          (node as Element).tagName.toLowerCase() === tagName.toLowerCase()) {
        break;
      }
      node = node.parentNode;
    }
    
    if (node && node !== this.editor) {
      const parent = node.parentNode;
      if (parent) {
        // Move all children out
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        // Remove the empty formatting element
        parent.removeChild(node);
      }
    }
  }

  private cleanupEmptyNodes(root: Node): void {
    const treeWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          return (node.childNodes.length === 0) ? 
            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    const emptyNodes: Node[] = [];
    let currentNode = treeWalker.nextNode();
    
    while (currentNode) {
      emptyNodes.push(currentNode);
      currentNode = treeWalker.nextNode();
    }
    
    // Remove empty nodes
    emptyNodes.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
  }
}