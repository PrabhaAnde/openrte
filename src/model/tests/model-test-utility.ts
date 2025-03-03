import { DocumentModel } from '../document-model';
import { HTMLParser } from '../html-parser';
import { ModelInspector } from '../model-inspector';
import { Document, DocumentNode } from '../interfaces';

/**
 * Test utility for verifying document model functionality
 */
export class ModelTestUtility {
  /**
   * Run all tests and log results
   */
  static runAllTests(): boolean {
    console.group('Document Model Tests');
    
    let allTestsPassed = true;
    
    // Run individual tests
    allTestsPassed = this.testDocumentCreation() && allTestsPassed;
    allTestsPassed = this.testNodeOperations() && allTestsPassed;
    allTestsPassed = this.testHTMLParsing() && allTestsPassed;
    allTestsPassed = this.testModelInspection() && allTestsPassed;
    
    console.groupEnd();
    
    // Log overall result
    if (allTestsPassed) {
      console.log('%c✅ All document model tests passed!', 'color: green; font-weight: bold;');
    } else {
      console.log('%c❌ Some document model tests failed!', 'color: red; font-weight: bold;');
    }
    
    return allTestsPassed;
  }
  
  /**
   * Test document creation
   */
  static testDocumentCreation(): boolean {
    console.group('Test: Document Creation');
    
    try {
      // Create an empty document model
      const model = new DocumentModel();
      const doc = model.getDocument();
      
      console.log('Created document structure:', doc);
      
      // Verify document structure
      if (doc.type !== 'root') {
        throw new Error('Document root should have type "root"');
      }
      
      if (!doc.id || typeof doc.id !== 'string') {
        throw new Error('Document should have valid ID');
      }
      
      if (!Array.isArray(doc.children)) {
        throw new Error('Document children should be an array');
      }
      
      console.log('%c✅ Document creation test passed!', 'color: green');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Document creation test failed:', error);
      console.groupEnd();
      return false;
    }
  }
  
  /**
   * Test node operations
   */
  static testNodeOperations(): boolean {
    console.group('Test: Node Operations');
    
    try {
      const model = new DocumentModel();
      
      // Create text node
      const textNode = model.createTextNode('Hello, world!', [{ type: 'bold' }]);
      console.log('Created text node:', textNode);
      
      // Verify text node
      if (textNode.type !== 'text' || textNode.text !== 'Hello, world!') {
        throw new Error('Text node creation failed');
      }
      
      if (!textNode.marks || textNode.marks.length !== 1 || textNode.marks[0].type !== 'bold') {
        throw new Error('Text node marks creation failed');
      }
      
      // Create element node
      const paraNode = model.createElementNode('paragraph', { class: 'test' }, [textNode]);
      console.log('Created paragraph node:', paraNode);
      
      // Verify element node
      if (paraNode.type !== 'paragraph') {
        throw new Error('Element node creation failed');
      }
      
      if (!paraNode.attributes || paraNode.attributes.class !== 'test') {
        throw new Error('Element node attributes failed');
      }
      
      if (!paraNode.children || paraNode.children.length !== 1) {
        throw new Error('Element node children failed');
      }
      
      // Create heading
      const headingNode = model.createHeading(2, 'Test Heading');
      console.log('Created heading node:', headingNode);
      
      // Verify heading
      if (headingNode.type !== 'heading' || !headingNode.attributes || 
          headingNode.attributes.level !== '2') {
        throw new Error('Heading creation failed');
      }
      
      // Add to document
      model.appendChild(paraNode);
      model.appendChild(headingNode);
      
      const doc = model.getDocument();
      
      // Verify document structure
      if (doc.children.length !== 2) {
        throw new Error('Document should have 2 children');
      }
      
      // Find node by ID
      const foundNode = model.findNodeById(paraNode.id);
      
      if (!foundNode || foundNode.id !== paraNode.id) {
        throw new Error('findNodeById failed');
      }
      
      // Get nodes by type
      const paragraphs = model.getNodesByType('paragraph');
      const headings = model.getNodesByType('heading');
      
      if (paragraphs.length !== 1 || headings.length !== 1) {
        throw new Error('getNodesByType failed');
      }
      
      console.log('%c✅ Node operations test passed!', 'color: green');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Node operations test failed:', error);
      console.groupEnd();
      return false;
    }
  }
  
  /**
   * Test HTML parsing
   */
  static testHTMLParsing(): boolean {
    console.group('Test: HTML Parsing');
    
    try {
      const model = new DocumentModel();
      
      // Simple HTML
      const simpleHTML = '<p>Hello <strong>world</strong>!</p>';
      const simpleDoc = HTMLParser.parse(simpleHTML, model);
      
      console.log('Parsed simple HTML:', simpleDoc);
      
      // Verify simple parsing
      if (simpleDoc.type !== 'root') {
        throw new Error('Parsed document should have root type');
      }
      
      if (!('children' in simpleDoc) || !simpleDoc.children || simpleDoc.children.length !== 1) {
        throw new Error('Parsed document should have 1 child');
      }
      
      const paragraph = simpleDoc.children[0];
      
      if (paragraph.type !== 'paragraph') {
        throw new Error('First child should be paragraph');
      }
      
      // Complex HTML
      const complexHTML = `
        <h1>Test Heading</h1>
        <p>This is a <em>test</em> paragraph with <strong>bold</strong> text.</p>
        <ul>
          <li>Item 1</li>
          <li>Item <strong>2</strong></li>
        </ul>
      `;
      
      const complexDoc = HTMLParser.parse(complexHTML, model);
      
      console.log('Parsed complex HTML:', complexDoc);
      
      // Verify complex parsing
      if (!('children' in complexDoc) || !complexDoc.children || complexDoc.children.length !== 3) {
        throw new Error('Complex document should have 3 children');
      }
      
      // Find marked text
      const boldTextNodes = ModelInspector.findTextWithMark(complexDoc, 'bold');
      
      if (boldTextNodes.length !== 2) {
        throw new Error('Should find 2 bold text nodes');
      }
      
      console.log('Found bold text nodes:', boldTextNodes);
      
      console.log('%c✅ HTML parsing test passed!', 'color: green');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ HTML parsing test failed:', error);
      console.groupEnd();
      return false;
    }
  }  
  /**
   * Test model inspection
   */
  static testModelInspection(): boolean {
    console.group('Test: Model Inspection');
    
    try {
      const model = new DocumentModel();
      
      // Create a document with various nodes
      const doc: Document = {
        type: 'root',
        id: 'root-1',
        children: [
          {
            type: 'heading',
            id: 'heading-1',
            attributes: { level: '1' },
            children: [
              { type: 'text', id: 'text-1', text: 'Heading Text' }
            ]
          },
          {
            type: 'paragraph',
            id: 'para-1',
            children: [
              { type: 'text', id: 'text-2', text: 'Normal text ' },
              { type: 'text', id: 'text-3', text: 'Bold text', marks: [{ type: 'bold' }] },
              { type: 'text', id: 'text-4', text: ' and italic text', marks: [{ type: 'italic' }] }
            ]
          }
        ]
      };
      
      // Set the document
      model.setDocument(doc);
      
      // Test string representation
      const docString = ModelInspector.nodeToString(doc);
      console.log('Document string representation:', docString);
      
      if (!docString || typeof docString !== 'string') {
        throw new Error('nodeToString should return a string');
      }
      
      // Test node counting
      const nodeCounts = ModelInspector.countNodesByType(doc);
      console.log('Node counts:', nodeCounts);
      
      if (!nodeCounts.root || nodeCounts.root !== 1) {
        throw new Error('Should count 1 root node');
      }
      
      if (!nodeCounts.heading || nodeCounts.heading !== 1) {
        throw new Error('Should count 1 heading node');
      }
      
      if (!nodeCounts.paragraph || nodeCounts.paragraph !== 1) {
        throw new Error('Should count 1 paragraph node');
      }
      
      if (!nodeCounts.text || nodeCounts.text !== 4) {
        throw new Error('Should count 4 text nodes');
      }
      
      // Test finding text with marks
      const boldTextNodes = ModelInspector.findTextWithMark(doc, 'bold');
      const italicTextNodes = ModelInspector.findTextWithMark(doc, 'italic');
      
      console.log('Bold text nodes:', boldTextNodes);
      console.log('Italic text nodes:', italicTextNodes);
      
      if (boldTextNodes.length !== 1) {
        throw new Error('Should find 1 bold text node');
      }
      
      if (italicTextNodes.length !== 1) {
        throw new Error('Should find 1 italic text node');
      }
      
      // Test document stats
      const stats = ModelInspector.getDocumentStats(doc);
      console.log('Document stats:', stats);
      
      if (stats.nodeCount !== 7) {
        throw new Error('Document should have 7 nodes total');
      }
      
      if (stats.textNodeCount !== 4) {
        throw new Error('Document should have 4 text nodes');
      }
      
      console.log('%c✅ Model inspection test passed!', 'color: green');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Model inspection test failed:', error);
      console.groupEnd();
      return false;
    }
  }
}