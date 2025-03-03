import { Editor } from '../../core/editor';
import { ModelInspector } from '../model-inspector';

/**
 * Tests for Editor integration with document model
 */
export class EditorIntegrationTest {
  /**
   * Run all editor integration tests
   * 
   * @param containerElement Container element for editor
   * @returns Test result
   */
  static runTests(containerElement: HTMLElement): boolean {
    console.group('Editor Integration Tests');
    
    let allTestsPassed = true;
    
    try {
      // Create editor instance
      const editor = new Editor(containerElement);
      
      // Test model initialization
      if (!this.testModelInitialization(editor)) {
        allTestsPassed = false;
      }
      
      // Test content parsing
      if (!this.testContentParsing(editor)) {
        allTestsPassed = false;
      }
      
      // Test model updates
      if (!this.testModelUpdates(editor)) {
        allTestsPassed = false;
      }
      
      if (allTestsPassed) {
        console.log('%c✅ All editor integration tests passed!', 'color: green; font-weight: bold;');
      } else {
        console.error('%c❌ Some editor integration tests failed!', 'color: red; font-weight: bold;');
      }
      
      console.groupEnd();
      return allTestsPassed;
    } catch (error) {
      console.error('❌ Editor integration tests failed with an error:', error);
      console.groupEnd();
      return false;
    }
  }
  
  /**
   * Test document model initialization
   * 
   * @param editor Editor instance
   * @returns Test result
   */
  private static testModelInitialization(editor: Editor): boolean {
    console.group('Test: Model Initialization');
    
    try {
      // Check if document model is initialized
      const model = editor.getDocumentModel();
      
      if (!model) {
        throw new Error('Document model should be initialized');
      }
      
      // Check if document is created
      const document = model.getDocument();
      
      if (!document || document.type !== 'root') {
        throw new Error('Document should have root type');
      }
      
      console.log('%c✅ Model initialization test passed!', 'color: green');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Model initialization test failed:', error);
      console.groupEnd();
      return false;
    }
  }
  
  /**
   * Test content parsing
   * 
   * @param editor Editor instance
   * @returns Test result
   */
  private static testContentParsing(editor: Editor): boolean {
    console.group('Test: Content Parsing');
    
    try {
      // Set some HTML content
      const testHTML = '<h1>Test Heading</h1><p>Test <strong>paragraph</strong>.</p>';
      editor.setContent(testHTML);
      
      // Check if document model was updated
      const model = editor.getDocumentModel();
      const document = model.getDocument();
      
      console.log('Document after parsing:', document);
      
      // Check document structure
      if (!document.children || document.children.length === 0) {
        throw new Error('Document should have children after parsing');
      }
      
      // Check for heading
      const headings = model.getNodesByType('heading');
      
      if (headings.length !== 1) {
        throw new Error(`Expected 1 heading, found ${headings.length}`);
      }
      
      // Check for strong formatting
      const boldTextNodes = ModelInspector.findTextWithMark(document, 'bold');
      
      if (boldTextNodes.length !== 1) {
        throw new Error(`Expected 1 bold text node, found ${boldTextNodes.length}`);
      }
      
      console.log('%c✅ Content parsing test passed!', 'color: green');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Content parsing test failed:', error);
      console.groupEnd();
      return false;
    }
  }
  
  /**
   * Test model updates
   * 
   * @param editor Editor instance
   * @returns Test result
   */
  private static testModelUpdates(editor: Editor): boolean {
    console.group('Test: Model Updates');
    
    try {
      // Initial content
      editor.setContent('<p>Initial content</p>');
      
      const model = editor.getDocumentModel();
      const initialDoc = model.getDocument();
      const initialStats = ModelInspector.getDocumentStats(initialDoc);
      
      console.log('Initial document stats:', initialStats);
      
      // Update content
      editor.setContent('<p>Updated content with <em>emphasis</em></p>');
      
      const updatedDoc = model.getDocument();
      const updatedStats = ModelInspector.getDocumentStats(updatedDoc);
      
      console.log('Updated document stats:', updatedStats);
      
      // Verify model was updated
      if (updatedStats.textNodeCount === initialStats.textNodeCount) {
        throw new Error('Document model should be updated after content change');
      }
      
      // Check for italic formatting in updated content
      const italicTextNodes = ModelInspector.findTextWithMark(updatedDoc, 'italic');
      
      if (italicTextNodes.length !== 1) {
        throw new Error(`Expected 1 italic text node after update, found ${italicTextNodes.length}`);
      }
      
      console.log('%c✅ Model updates test passed!', 'color: green');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Model updates test failed:', error);
      console.groupEnd();
      return false;
    }
  }
}