import React, { useRef, useState } from 'react';
import OpenRTE, { EditorHandle } from '../src/adapters/react';
import { SpecialCharactersPlugin } from '../src/plugins';

// Example of custom plugin import
// import { MyCustomPlugin } from './my-custom-plugin';

const App: React.FC = () => {
  // For controlled component usage
  const [content, setContent] = useState('<h1>Hello OpenRTE!</h1><p>This is a React example.</p>');
  
  // Reference to access imperative methods
  const editorRef = useRef<EditorHandle>(null);
  
  // Example of using the editor ref
  const handleGetContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.getContent();
      console.log('Current content:', html);
      alert('Current content has been logged to console');
    }
  };
  
  // Example of setting content
  const handleSetContent = () => {
    if (editorRef.current) {
      editorRef.current.setContent('<h2>Content updated programmatically</h2><p>The content was updated using the editor ref.</p>');
    }
  };
  
  // Example of focusing the editor
  const handleFocus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  // Example of handling content changes
  const handleChange = (html: string) => {
    setContent(html);
    console.log('Content changed:', html);
  };
  
  return (
    <div className="app">
      <h1>OpenRTE React Example</h1>
      
      <div className="editor-container">
        <h2>Editor (Controlled Component)</h2>
        <OpenRTE
          ref={editorRef}
          value={content}
          onChange={handleChange}
          plugins={[new SpecialCharactersPlugin()]} // Example of adding plugins
          height={400}
          style={{ border: '1px solid #ccc', borderRadius: '4px' }}
          placeholder="Type your content here..."
          onFocus={() => console.log('Editor focused')}
          onBlur={() => console.log('Editor blurred')}
        />
      </div>
      
      <div className="controls">
        <h2>Controls</h2>
        <button onClick={handleGetContent}>Get Content</button>
        <button onClick={handleSetContent}>Set Content</button>
        <button onClick={handleFocus}>Focus Editor</button>
      </div>
      
      <div className="preview">
        <h2>HTML Preview</h2>
        <div 
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      
      <div className="raw-html">
        <h2>Raw HTML</h2>
        <pre>{content}</pre>
      </div>
    </div>
  );
};

export default App;