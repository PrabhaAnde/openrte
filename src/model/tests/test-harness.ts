import { ModelTestUtility } from './model-test-utility';
import { DocumentModel } from '../document-model';
import { HTMLParser } from '../html-parser';
import { ModelInspector } from '../model-inspector';

/**
 * Test harness for document model
 */
export class DocumentModelTestHarness {
  /**
   * Editor container element
   */
  private container: HTMLElement;
  
  /**
   * Editor content area
   */
  private editor!: HTMLElement;
  
  /**
   * Output area for test results
   */
  private output!: HTMLElement;
  
  /**
   * Document model instance
   */
  private model: DocumentModel;
  
  /**
   * Constructor
   * 
   * @param containerId Container element ID
   */
  constructor(containerId: string) {
    // Get container
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }
    
    this.container = container;
    this.model = new DocumentModel();
    
    // Create UI
    this.createUI();
  }
  
  /**
   * Create test UI
   */
  private createUI(): void {
    // Clear container
    this.container.innerHTML = '';
    
    // Create header
    const header = document.createElement('h1');
    header.textContent = 'Document Model Test Harness';
    this.container.appendChild(header);
    
    // Create description
    const description = document.createElement('p');
    description.textContent = 'This utility tests the document model implementation.';
    this.container.appendChild(description);
    
    // Create editor
    const editorLabel = document.createElement('h2');
    editorLabel.textContent = 'Test Editor';
    this.container.appendChild(editorLabel);
    
    this.editor = document.createElement('div');
    this.editor.className = 'test-editor';
    this.editor.contentEditable = 'true';
    this.editor.innerHTML = '<p>Edit this content to test the HTML parsing.</p>';
    this.container.appendChild(this.editor);
    
    // Create button group
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    this.container.appendChild(buttonGroup);
    
    // Create buttons
    const runTestsButton = document.createElement('button');
    runTestsButton.textContent = 'Run All Tests';
    runTestsButton.addEventListener('click', () => this.runAllTests());
    buttonGroup.appendChild(runTestsButton);
    
    const parseButton = document.createElement('button');
    parseButton.textContent = 'Parse Current Content';
    parseButton.addEventListener('click', () => this.parseCurrentContent());
    buttonGroup.appendChild(parseButton);
    
    const formatButton = document.createElement('button');
    formatButton.textContent = 'Add Test Formatting';
    formatButton.addEventListener('click', () => this.addTestFormatting());
    buttonGroup.appendChild(formatButton);
    
    // Create output area
    const outputLabel = document.createElement('h2');
    outputLabel.textContent = 'Test Results';
    this.container.appendChild(outputLabel);
    
    this.output = document.createElement('div');
    this.output.className = 'test-output';
    this.container.appendChild(this.output);
    
    // Add some basic styles
    const style = document.createElement('style');
    style.textContent = `
      .test-editor {
        border: 1px solid #ccc;
        padding: 10px;
        min-height: 100px;
        margin-bottom: 10px;
      }
      
      .button-group {
        margin-bottom: 10px;
      }
      
      .button-group button {
        margin-right: 10px;
        padding: 5px 10px;
      }
      
      .test-output {
        border: 1px solid #ccc;
        background-color: #f8f8f8;
        padding: 10px;
        min-height: 200px;
        overflow: auto;
        font-family: monospace;
        white-space: pre-wrap;
      }
      
      .success {
        color: green;
        font-weight: bold;
      }
      
      .error {
        color: red;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Run all tests
   */
  private runAllTests(): void {
    this.log('Running all document model tests...');
    
    // Redirect console.log to our output
    const originalLog = console.log;
    const originalError = console.error;
    const originalGroup = console.group;
    const originalGroupEnd = console.groupEnd;
    
    console.log = (...args) => {
      originalLog(...args);
      this.log(args.map(arg => this.formatArg(arg)).join(' '));
    };
    
    console.error = (...args) => {
      originalError(...args);
      this.logError(args.map(arg => this.formatArg(arg)).join(' '));
    };
    
    console.group = (label) => {
      originalGroup(label);
      this.log(`\n== ${label} ==`);
    };
    
    console.groupEnd = () => {
      originalGroupEnd();
      this.log('');
    };
    
    try {
      const result = ModelTestUtility.runAllTests();
      
      if (result) {
        this.logSuccess('✅ All tests completed successfully!');
      } else {
        this.logError('❌ Some tests failed!');
      }
    } catch (error: unknown) {
      this.logError('❌ Error during test execution:');
      if (error instanceof Error) {
        this.logError(error.toString());
      } else {
        this.logError('An unknown error occurred');
      }
    } finally {
      // Restore console functions
      console.log = originalLog;
      console.error = originalError;
      console.group = originalGroup;
      console.groupEnd = originalGroupEnd;
    }
  }  
  /**
   * Parse current editor content
   */
  private parseCurrentContent(): void {
    this.log('Parsing current editor content...');
    
    try {
      const html = this.editor.innerHTML;
      this.log(`HTML content: ${html}`);
      
      const document = HTMLParser.parse(html, this.model);
      
      this.log('Parsed document model:');
      this.log(ModelInspector.nodeToString(document));
      
      const stats = ModelInspector.getDocumentStats(document as any);
      this.log('\nDocument statistics:');
      this.log(`- Total nodes: ${stats.nodeCount}`);
      this.log(`- Text nodes: ${stats.textNodeCount}`);
      this.log(`- Word count: ${stats.wordCount}`);
      this.log(`- Character count: ${stats.charCount}`);
      this.log('- Formatting:');
      
      Object.entries(stats.formattingCount).forEach(([type, count]) => {
        this.log(`  - ${type}: ${count}`);
      });
      
      this.logSuccess('✅ Document parsed successfully!');
    } catch (error: unknown) {
      this.logError('❌ Error parsing document:');
      if (error instanceof Error) {
        this.logError(error.toString());
      } else {
        this.logError('An unknown error occurred');
      }
    }
  }  
  /**
   * Add test formatting to editor content
   */
  private addTestFormatting(): void {
    this.editor.innerHTML = `
      <h1>Document Model Test</h1>
      <p>This paragraph contains <strong>bold</strong>, <em>italic</em>, and <u>underlined</u> text.</p>
      <h2>Lists and Structure</h2>
      <ul>
        <li>Unordered list item 1</li>
        <li>Unordered list item 2</li>
      </ul>
      <ol>
        <li>Ordered list item 1</li>
        <li>Ordered list item with <strong>bold text</strong></li>
      </ol>
      <p>A paragraph with <a href="https://example.com">a link</a> inside it.</p>
      <table>
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
        </tr>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
        </tr>
      </table>
    `;
    
    this.log('Added test formatting to editor content.');
    this.log('Click "Parse Current Content" to see the document model representation.');
  }
  
  /**
   * Log a message to the output
   * 
   * @param message Message to log
   */
  private log(message: string): void {
    const line = document.createElement('div');
    line.textContent = message;
    this.output.appendChild(line);
    
    // Scroll to bottom
    this.output.scrollTop = this.output.scrollHeight;
  }
  
  /**
   * Log a success message to the output
   * 
   * @param message Success message to log
   */
  private logSuccess(message: string): void {
    const line = document.createElement('div');
    line.textContent = message;
    line.className = 'success';
    this.output.appendChild(line);
    
    // Scroll to bottom
    this.output.scrollTop = this.output.scrollHeight;
  }
  
  /**
   * Log an error message to the output
   * 
   * @param message Error message to log
   */
  private logError(message: string): void {
    const line = document.createElement('div');
    line.textContent = message;
    line.className = 'error';
    this.output.appendChild(line);
    
    // Scroll to bottom
    this.output.scrollTop = this.output.scrollHeight;
  }
  
  /**
   * Format a console argument for display
   * 
   * @param arg Argument to format
   * @returns Formatted string
   */
  private formatArg(arg: any): string {
    if (typeof arg === 'string') {
      // Handle color formatting in console.log
      if (arg.includes('%c')) {
        return arg.replace(/%c/g, '');
      }
      return arg;
    } else if (arg === null) {
      return 'null';
    } else if (arg === undefined) {
      return 'undefined';
    } else if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return arg.toString();
      }
    } else {
      return String(arg);
    }
  }
}

/**
 * Initialize the test harness
 * 
 * @param containerId Container element ID
 */
export function initDocumentModelTests(containerId: string): void {
  try {
    new DocumentModelTestHarness(containerId);
  } catch (error) {
    console.error('Failed to initialize document model test harness:', error);
  }
}