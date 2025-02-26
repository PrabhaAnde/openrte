import { BasePlugin } from '../base-plugin';
import { Editor } from '../../core/editor';
import { createIcon } from '../../ui/icon';

interface CharacterGroup {
  name: string;
  characters: SpecialCharacter[];
}

interface SpecialCharacter {
  char: string;
  title: string;
}

export class SpecialCharactersPlugin extends BasePlugin {
  private charDialog: HTMLElement;
  private isDialogVisible: boolean = false;
  
  // Define groups of special characters
  private characterGroups: CharacterGroup[] = [
    {
      name: 'Math Symbols',
      characters: [
        { char: '±', title: 'Plus-Minus' },
        { char: '×', title: 'Multiplication' },
        { char: '÷', title: 'Division' },
        { char: '∑', title: 'Summation' },
        { char: '√', title: 'Square Root' },
        { char: '∞', title: 'Infinity' },
        { char: '≠', title: 'Not Equal' },
        { char: '≈', title: 'Approximately' },
        { char: '≤', title: 'Less Than or Equal' },
        { char: '≥', title: 'Greater Than or Equal' }
      ]
    },
    {
      name: 'Currency',
      characters: [
        { char: '€', title: 'Euro' },
        { char: '£', title: 'Pound' },
        { char: '¥', title: 'Yen' },
        { char: '₹', title: 'Rupee' },
        { char: '₽', title: 'Ruble' },
        { char: '¢', title: 'Cent' },
        { char: '₿', title: 'Bitcoin' }
      ]
    },
    {
      name: 'Punctuation',
      characters: [
        { char: '§', title: 'Section' },
        { char: '¶', title: 'Paragraph' },
        { char: '©', title: 'Copyright' },
        { char: '®', title: 'Registered' },
        { char: '™', title: 'Trademark' },
        { char: '•', title: 'Bullet' },
        { char: '…', title: 'Ellipsis' },
        { char: '«', title: 'Left Quote' },
        { char: '»', title: 'Right Quote' },
        { char: '‹', title: 'Single Left Quote' },
        { char: '›', title: 'Single Right Quote' },
        { char: '—', title: 'Em Dash' },
        { char: '–', title: 'En Dash' }
      ]
    },
    {
      name: 'Arrows',
      characters: [
        { char: '←', title: 'Left Arrow' },
        { char: '→', title: 'Right Arrow' },
        { char: '↑', title: 'Up Arrow' },
        { char: '↓', title: 'Down Arrow' },
        { char: '↔', title: 'Left-Right Arrow' },
        { char: '↕', title: 'Up-Down Arrow' },
        { char: '⇒', title: 'Double Right Arrow' },
        { char: '⇐', title: 'Double Left Arrow' }
      ]
    }
  ];
  
  constructor() {
      super('specialCharacters', null, 'Special Characters', 'openrte-special-chars-button');

    
    
    // Create the character dialog
    this.charDialog = this.createCharacterDialog();
    document.body.appendChild(this.charDialog);
    
    // Override button click
    this.button.removeEventListener('click', this.handleClick);
    this.button.addEventListener('click', this.toggleDialog.bind(this));
    
    // Add close handler for clicks outside dialog
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }

  createToolbarControl(): HTMLElement {
    const button = super.createToolbarControl();
    button.textContent = 'Ω'; // Special character as text
    return button;
  }
  
  init(editor: Editor): void {
    super.init(editor);
  }
  
  execute(): void {
    // The dialog handles character insertion
  }
  
  private createCharacterDialog(): HTMLElement {
    const dialog = document.createElement('div');
    dialog.className = 'openrte-special-chars-dialog';
    dialog.style.display = 'none';
    dialog.style.position = 'absolute';
    dialog.style.zIndex = '1000';
    dialog.style.backgroundColor = 'white';
    dialog.style.border = '1px solid #ccc';
    dialog.style.borderRadius = '4px';
    dialog.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    dialog.style.padding = '10px';
    dialog.style.width = '300px';
    dialog.style.maxHeight = '400px';
    dialog.style.overflowY = 'auto';
    
    // Create tabs container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'openrte-special-chars-tabs';
    tabsContainer.style.display = 'flex';
    tabsContainer.style.borderBottom = '1px solid #ccc';
    tabsContainer.style.marginBottom = '10px';
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'openrte-special-chars-content';
    
    // Create the tabs and content sections
    this.characterGroups.forEach((group, index) => {
      // Create tab
      const tab = document.createElement('div');
      tab.className = 'openrte-special-chars-tab';
      tab.textContent = group.name;
      tab.dataset.index = index.toString();
      tab.style.padding = '5px 10px';
      tab.style.cursor = 'pointer';
      tab.style.borderBottom = index === 0 ? '2px solid #0066cc' : 'none';
      
      tab.addEventListener('click', (e) => {
        // Hide all content sections
        const contents = contentContainer.querySelectorAll('.openrte-special-chars-section');
        contents.forEach(content => {
          (content as HTMLElement).style.display = 'none';
        });
        
        // Show selected content
        const selectedContent = contentContainer.querySelector(`.openrte-special-chars-section[data-index="${tab.dataset.index}"]`);
        if (selectedContent) {
          (selectedContent as HTMLElement).style.display = 'grid';
        }
        
        // Update tab styles
        const tabs = tabsContainer.querySelectorAll('.openrte-special-chars-tab');
        tabs.forEach(t => {
          (t as HTMLElement).style.borderBottom = 'none';
        });
        tab.style.borderBottom = '2px solid #0066cc';
      });
      
      tabsContainer.appendChild(tab);
      
      // Create content section
      const section = document.createElement('div');
      section.className = 'openrte-special-chars-section';
      section.dataset.index = index.toString();
      section.style.display = index === 0 ? 'grid' : 'none';
      section.style.gridTemplateColumns = 'repeat(6, 1fr)';
      section.style.gap = '5px';
      
      // Add characters to the section
      group.characters.forEach(char => {
        const charButton = document.createElement('button');
        charButton.className = 'openrte-special-char-button';
        charButton.textContent = char.char;
        charButton.title = char.title;
        charButton.style.width = '32px';
        charButton.style.height = '32px';
        charButton.style.fontSize = '16px';
        charButton.style.display = 'flex';
        charButton.style.alignItems = 'center';
        charButton.style.justifyContent = 'center';
        charButton.style.cursor = 'pointer';
        charButton.style.border = '1px solid #ddd';
        charButton.style.borderRadius = '3px';
        charButton.style.backgroundColor = '#f8f8f8';
        
        charButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.insertCharacter(char.char);
          this.hideDialog();
        });
        
        charButton.addEventListener('mouseover', () => {
          charButton.style.backgroundColor = '#e8e8e8';
        });
        
        charButton.addEventListener('mouseout', () => {
          charButton.style.backgroundColor = '#f8f8f8';
        });
        
        section.appendChild(charButton);
      });
      
      contentContainer.appendChild(section);
    });
    
    dialog.appendChild(tabsContainer);
    dialog.appendChild(contentContainer);
    
    return dialog;
  }
  
  private toggleDialog(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.isDialogVisible) {
      this.hideDialog();
    } else {
      this.showDialog();
    }
  }
  
  private showDialog(): void {
    if (!this.editor) return;
    
    // Position the dialog relative to the button
    const rect = this.button.getBoundingClientRect();
    this.charDialog.style.top = `${rect.bottom + window.scrollY + 5}px`;
    this.charDialog.style.left = `${rect.left + window.scrollX}px`;
    
    // Show the dialog
    this.charDialog.style.display = 'block';
    this.isDialogVisible = true;
  }
  
  private hideDialog(): void {
    this.charDialog.style.display = 'none';
    this.isDialogVisible = false;
    
    // Focus the editor
    if (this.editor) {
      this.editor.focus();
    }
  }
  
  private handleOutsideClick(event: MouseEvent): void {
    if (!this.isDialogVisible) return;
    
    // Check if click is outside dialog and button
    if (event.target !== this.charDialog && 
        !this.charDialog.contains(event.target as Node) &&
        event.target !== this.button && 
        !this.button.contains(event.target as Node)) {
      this.hideDialog();
    }
  }
  
  private insertCharacter(char: string): void {
    if (!this.editor) return;
    
    // Get selection
    const selectionManager = this.editor.getSelectionManager();
    const range = selectionManager.getRange();
    
    if (range) {
      // Delete any selected content
      range.deleteContents();
      
      // Insert the character
      const textNode = document.createTextNode(char);
      range.insertNode(textNode);
      
      // Move cursor after the inserted character
      range.setStartAfter(textNode);
      range.collapse(true);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // Focus the editor
    this.editor.focus();
  }
  
  destroy(): void {
    document.removeEventListener('click', this.handleOutsideClick);
    
    // Remove the dialog from DOM
    if (this.charDialog.parentNode) {
      this.charDialog.parentNode.removeChild(this.charDialog);
    }
    
    super.destroy();
  }
}