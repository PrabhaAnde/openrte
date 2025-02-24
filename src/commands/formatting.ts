import { SelectionManager } from '../core/selection';

export class FormattingCommands {
  private selectionManager: SelectionManager;

  constructor(editor: HTMLElement) {
    this.selectionManager = new SelectionManager(editor);
  }

  bold(): void {
    const range = this.selectionManager.getRange();
    if (!range) return;
    
    if (this.isFormatActive('strong')) {
      this.unwrapTag(range, 'strong');
    } else {
      this.wrapSelection(range, 'strong');
    }
  }

  private isFormatActive(tagName: string): boolean {
    const range = this.selectionManager.getRange();
    if (!range) return false;
    
    let node: Node | null = range.commonAncestorContainer;
    while (node && node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    return node?.nodeName.toLowerCase() === tagName;
  }
  private wrapSelection(range: Range, tagName: string): void {
    const newNode = document.createElement(tagName);
    range.surroundContents(newNode);
  }

  private unwrapTag(range: Range, tagName: string): void {
    const parent = range.commonAncestorContainer.parentElement;
    if (parent?.nodeName.toLowerCase() === tagName) {
      while (parent.firstChild) {
        parent.parentNode?.insertBefore(parent.firstChild, parent);
      }
      parent.parentNode?.removeChild(parent);
    }
  }
}