# OpenRTE - Open-Source Rich Text Editor

OpenRTE is a framework-agnostic rich text editor built with TypeScript. It provides a comprehensive set of text editing features with an extensible plugin architecture.

## Features

- **Framework Agnostic** - Use with React, Vue, Angular, or vanilla JavaScript
- **Modular Plugin Architecture** - Easy to extend with custom plugins
- **Complete Editing Features** - Text formatting, paragraph styling, tables, and more
- **TypeScript Support** - Full type definitions for better developer experience
- **Lightweight** - No dependencies, focused on performance
- **Customizable** - Style and configure to match your application

## Installation

```bash
npm install openrte --save
```

## Usage

### React

```jsx
import React, { useState } from 'react';
import { OpenRTEReact } from 'openrte';

const MyEditor = () => {
  const [content, setContent] = useState('<h1>Hello OpenRTE!</h1>');

  return (
    <OpenRTEReact
      value={content}
      onChange={setContent}
      height={400}
      placeholder="Start typing..."
    />
  );
};

export default MyEditor;```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>OpenRTE Example</title>
</head>
<body>
  <div id="editor"></div>
  
  <script src="path/to/openrte.bundle.js"></script>
  <script>
    const editor = new OpenRTE.OpenRTEVanilla('#editor', {
      content: '<h1>Hello OpenRTE!</h1>',
      height: 400,
      onChange: (html) => console.log('Content changed:', html)
    });
  </script>
</body>
</html>```

## API Reference

### React Component

```jsx
<OpenRTEReact
  // Content (controlled component)
  value={string}
  onChange={(html: string) => void}
  
  // Or use as uncontrolled component
  initialContent={string}
  
  // Additional plugins
  plugins={Plugin[]}
  
  // Appearance
  height={string | number}
  width={string | number}
  className={string}
  style={React.CSSProperties}
  
  // Features
  placeholder={string}
  readOnly={boolean}
  
  // Events
  onFocus={() => void}
  onBlur={() => void}
/>```


### Vanilla JavaScript

```typescript
const editor = new OpenRTEVanilla(element, {
  // Content
  content: string,
  
  // Additional plugins
  plugins: Plugin[],
  
  // Appearance
  height: string | number,
  width: string | number,
  className: string,
  
  // Features
  placeholder: string,
  readOnly: boolean,
  
  // Events
  onInit: (editor: Editor) => void,
  onChange: (html: string) => void,
  onFocus: () => void,
  onBlur: () => void
});

// Methods
editor.getContent(): string;
editor.setContent(html: string): void;
editor.focus(): void;
editor.setReadOnly(readOnly: boolean): void;
editor.getEditor(): Editor | null;
editor.destroy(): void;
```

## Creating Custom Plugins

OpenRTE has a powerful plugin architecture. Here's how to create a custom plugin:

```typescript
import { BasePlugin, Editor } from 'openrte';

export class MyCustomPlugin extends BasePlugin {
  constructor() {
    super('myCustomPlugin', 'My Plugin', 'my-custom-button');
  }
  
  init(editor: Editor): void {
    super.init(editor);
    // Initialize plugin
  }
  
  execute(): void {
    if (!this.editor) return;
    
    // Implement plugin functionality
  }
  
  destroy(): void {
    // Clean up resources
    super.destroy();
  }
}
```

Then register your custom plugin:

```jsx
// React
<OpenRTEReact plugins={[new MyCustomPlugin()]} />

// Vanilla JS
const editor = new OpenRTEVanilla('#editor', {
  plugins: [new MyCustomPlugin()]
});
```

## Styling

OpenRTE comes with default styles, but you can customize it to match your application. To override the default styles, target the CSS classes in your own stylesheet.

## Browser Support

OpenRTE supports all modern browsers:

- Chrome
- Firefox
- Safari
- Edge

## Keywords

rich text editor, WYSIWYG editor, framework-agnostic editor, TypeScript editor, React rich text editor, Vue text editor, Angular rich text editor, JavaScript text editor, customizable editor, lightweight editor, HTML editor, content editor, web editor, WYSIWYG, text formatting, markdown alternative, plugin-based editor, modular editor, open source editor, MIT licensed editor, responsive editor, browser-based editor, content management, table editor, paragraph styling, editor with TypeScript support, no-dependency editor, JavaScript component, web component, frontend editor


## License

This project is licensed under the MIT License - see the LICENSE file for details.