import { Plugin } from '../types/plugin';
import { Editor } from '../core/editor';
import { DocumentModel } from '../model/document-model';
import { DocumentRange } from '../model/selection-interfaces';
import { HTMLSerializer } from '../model/html-serializer';

/**
 * Testing utilities for plugins
 */
export class PluginTestUtils {
  /**
   * Test a plugin in DOM mode
   * 
   * @param plugin The plugin to test
   * @param editor The editor instance
   * @returns True if the execution succeeded without errors
   */
  static testDOMExecution(plugin: Plugin, editor: Editor): boolean {
    try {
      // Save initial state for comparison
      const initialContent = editor.getContent();
      
      // Execute the plugin
      plugin.execute();
      
      // Get final state
      const finalContent = editor.getContent();
      
      console.log(`DOM Execution Test for ${plugin.getName()}:`);
      console.log(`Initial content: ${initialContent}`);
      console.log(`Final content: ${finalContent}`);
      console.log(`Content changed: ${initialContent !== finalContent}`);
      
      return true;
    } catch (e) {
      console.error(`Error in DOM execution for ${plugin.getName()}:`, e);
      return false;
    }
  }
  
  /**
   * Test a plugin in model mode
   * 
   * @param plugin The plugin to test
   * @param model The document model
   * @param range The document range
   * @returns True if the execution succeeded without errors
   */
  static testModelExecution(
    plugin: Plugin, 
    model: DocumentModel, 
    range: DocumentRange
  ): boolean {
    if (!plugin.supportsDocumentModel || !plugin.supportsDocumentModel()) {
      console.warn(`Plugin ${plugin.getName()} does not support document model`);
      return false;
    }
    
    try {
      const adapter = plugin.getModelAdapter?.();
      if (!adapter) {
        console.warn(`Plugin ${plugin.getName()} does not provide a model adapter`);
        return false;
      }
      
      // Save initial state for comparison
      const initialDoc = model.getDocument();
      const initialHTML = HTMLSerializer.toHTML(initialDoc);
      
      // Apply the model operation
      adapter.applyToModel(model, range);
      
      // Get final state
      const finalDoc = model.getDocument();
      const finalHTML = HTMLSerializer.toHTML(finalDoc);
      
      console.log(`Model Execution Test for ${plugin.getName()}:`);
      console.log(`Initial HTML: ${initialHTML}`);
      console.log(`Final HTML: ${finalHTML}`);
      console.log(`Content changed: ${initialHTML !== finalHTML}`);
      
      return true;
    } catch (e) {
      console.error(`Error in model execution for ${plugin.getName()}:`, e);
      return false;
    }
  }
  
  /**
   * Verify plugin produces same result in both modes
   * 
   * @param plugin The plugin to test
   * @param editor The editor instance
   * @param testCases Array of test cases with HTML and selection
   * @returns True if all test cases pass
   */
  static verifyConsistentBehavior(
    plugin: Plugin, 
    editor: Editor,
    testCases: Array<{ html: string, selection: [number, number] }>
  ): boolean {
    if (!plugin.supportsDocumentModel || !plugin.supportsDocumentModel()) {
      console.warn(`Plugin ${plugin.getName()} does not support document model`);
      return false;
    }
    
    let allPassed = true;
    
    testCases.forEach((testCase, index) => {
      console.log(`Running test case ${index + 1}`);
      
      try {
        // Set up for DOM execution
        editor.setContent(testCase.html);
        
        // Set selection
        const range = document.createRange();
        const contentArea = editor.getContentArea();
        this.setDOMSelection(contentArea, testCase.selection[0], testCase.selection[1]);
        
        // Capture pre-execution state
        const domPreState = editor.getContent();
        
        // Execute DOM operation
        plugin.execute();
        
        // Capture post-execution state
        const domPostState = editor.getContent();
        
        // Reset for model execution
        editor.setContent(testCase.html);
        
        // Get model and range
        const model = editor.getDocumentModel();
        const modelRange = editor.getDocumentRange();
        
        if (!modelRange) {
          console.error('Failed to get document range');
          allPassed = false;
          return;
        }
        
        // Get adapter
        const adapter = plugin.getModelAdapter?.();
        if (!adapter) {
          console.error('Failed to get model adapter');
          allPassed = false;
          return;
        }
        
        // Capture pre-execution state
        const modelPreState = HTMLSerializer.toHTML(model.getDocument());
        
        // Execute model operation
        adapter.applyToModel(model, modelRange);
        
        // Render to see the changes
        editor.renderDocument();
        
        // Capture post-execution state
        const modelPostState = editor.getContent();
        
        // Compare results
        const domChanged = domPreState !== domPostState;
        const modelChanged = modelPreState !== HTMLSerializer.toHTML(model.getDocument());
        const resultsMatch = this.compareNormalizedHTML(domPostState, modelPostState);
        
        console.log(`Test case ${index + 1}:`);
        console.log(`- DOM execution changed content: ${domChanged}`);
        console.log(`- Model execution changed content: ${modelChanged}`);
        console.log(`- Results match: ${resultsMatch}`);
        
        if (!resultsMatch) {
          console.log('DOM result:', domPostState);
          console.log('Model result:', modelPostState);
          allPassed = false;
        }
      } catch (e) {
        console.error(`Error in test case ${index + 1}:`, e);
        allPassed = false;
      }
    });
    
    return allPassed;
  }
  
  /**
   * Set DOM selection for testing
   * 
   * @param element The element to select within
   * @param start Start offset
   * @param end End offset
   */
  private static setDOMSelection(
    element: HTMLElement, 
    start: number, 
    end: number
  ): void {
    // This is a simplified implementation that only works with simple text nodes
    // A more robust implementation would find nodes at the specified offsets
    const textNode = element.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      const range = document.createRange();
      range.setStart(textNode, start);
      range.setEnd(textNode, end);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
  
  /**
   * Compare HTML strings with normalization
   * 
   * @param html1 First HTML string
   * @param html2 Second HTML string
   * @returns True if the normalized HTML strings match
   */
  private static compareNormalizedHTML(html1: string, html2: string): boolean {
    // A more robust implementation would use a proper HTML parser
    // This is a simplified version that removes whitespace differences
    const normalize = (html: string) => {
      return html
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
    };
    
    return normalize(html1) === normalize(html2);
  }
}