import { Plugin } from '../types/plugin';
import { Editor } from '../core/editor';
import { IconName, createIcon } from '../ui/icon';

export abstract class BasePlugin implements Plugin {
  protected editor: Editor | null = null;
  protected button: HTMLElement;
  
  constructor(
    private readonly name: string,
    private readonly iconName: IconName | null,
    private readonly label: string,
    private readonly className: string = ''
  ) {
    // Create toolbar button
    this.button = document.createElement('button');
    
    // If an icon is specified, use it; otherwise, use text label
    if (iconName) {
      const iconElement = createIcon(iconName);
      this.button.appendChild(iconElement);
      // Add aria-label for accessibility
      this.button.setAttribute('aria-label', label);
      // Add title for tooltip
      this.button.title = label;
    } else {
      this.button.textContent = this.label;
    }
    
    this.button.className = `openrte-button ${this.className}`;
    this.button.addEventListener('click', this.handleClick.bind(this));
  }
  
  getName(): string {
    return this.name;
  }
  
  init(editor: Editor): void {
    this.editor = editor;
  }
  
  createToolbarControl(): HTMLElement {
    return this.button;
  }
  
  protected handleClick(event: MouseEvent): void {
    event.preventDefault();
    this.execute();
    
    // Focus back on the editor
    if (this.editor) {
      this.editor.focus();
    }
  }
  
  abstract execute(): void;
  
  destroy(): void {
    this.button.removeEventListener('click', this.handleClick);
    this.editor = null;
  }
}