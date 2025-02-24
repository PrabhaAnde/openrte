export declare class SelectionManager {
    private editor;
    constructor(editor: HTMLElement);
    getSelection(): Selection | null;
    getRange(): Range | null;
    saveSelection(): Range | null;
    restoreSelection(range: Range): void;
}
