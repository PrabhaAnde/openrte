export class SelectionManager {
  private editor: HTMLElement;

  constructor(editor: HTMLElement) {
    this.editor = editor;
  }

  getSelection(): Selection | null {
    const selection = window.getSelection();
    if (!selection) return null;
    
    // Verify selection is within editor
    let node = selection.anchorNode;
    while (node && node !== this.editor) {
      node = node.parentNode;
    }
    return node ? selection : null;
  }

  getRange(): Range | null {
    const selection = this.getSelection();
    return selection?.rangeCount ? selection.getRangeAt(0) : null;
  }

  saveSelection(): Range | null {
    const range = this.getRange();
    return range ? range.cloneRange() : null;
  }

  restoreSelection(range: Range): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}
