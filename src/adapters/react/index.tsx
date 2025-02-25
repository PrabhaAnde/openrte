import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Editor, Plugin } from '../../index';

// Interface for the editor ref handle
export interface EditorHandle {
  getContent: () => string;
  setContent: (html: string) => void;
  focus: () => void;
  getEditor: () => Editor | null;
}

// Props for the OpenRTE React component
export interface OpenRTEProps {
  // Initial HTML content
  initialContent?: string;
  
  // For controlled component usage
  value?: string;
  onChange?: (html: string) => void;
  
  // Additional plugins
  plugins?: Plugin[];
  
  // Disable default plugins
  disableDefaultPlugins?: boolean;
  
  // Editor customization
  height?: string | number;
  width?: string | number;
  
  // Editor class name
  className?: string;
  
  // Editor style
  style?: React.CSSProperties;
  
  // Placeholder text
  placeholder?: string;
  
  // Read-only mode
  readOnly?: boolean;
  
  // Events
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * React component for the OpenRTE editor
 */
const OpenRTE = forwardRef<EditorHandle, OpenRTEProps>((props, ref) => {
  const {
    initialContent = '',
    value,
    onChange,
    plugins = [],
    disableDefaultPlugins = false,
    height = 'auto',
    width = '100%',
    className = '',
    style = {},
    placeholder = '',
    readOnly = false,
    onFocus,
    onBlur
  } = props;
  
  // Container ref for the editor
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Reference to the editor instance
  const editorRef = useRef<Editor | null>(null);
  
  // Track if the editor has been initialized
  const [isEditorInitialized, setIsEditorInitialized] = useState(false);
  
  // Initialize editor on mount
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      // Import the editor dynamically to avoid SSR issues
      import('../../index').then(({ createEditor }) => {
        const editor = createEditor(containerRef.current!);
        editorRef.current = editor;
        
        // Set the content
        const contentToSet = value !== undefined ? value : initialContent;
        editor.setContent(contentToSet);
        
        // Register additional plugins
        if (plugins.length > 0) {
          plugins.forEach(plugin => editor.registerPlugin(plugin));
        }
        
        // Handle changes if it's a controlled component
        if (onChange) {
          const contentArea = editor.getContentArea();
          contentArea.addEventListener('input', handleEditorChange);
        }
        
        // Add focus and blur events
        if (onFocus || onBlur) {
          const contentArea = editor.getContentArea();
          if (onFocus) contentArea.addEventListener('focus', onFocus);
          if (onBlur) contentArea.addEventListener('blur', onBlur);
        }
        
        // Handle read-only mode
        if (readOnly) {
          const contentArea = editor.getContentArea();
          contentArea.contentEditable = 'false';
        }
        
        // Add placeholder if needed
        if (placeholder) {
          addPlaceholder(editor, placeholder);
        }
        
        setIsEditorInitialized(true);
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (editorRef.current) {
        const editor = editorRef.current;
        
        // Remove event listeners
        if (onChange) {
          const contentArea = editor.getContentArea();
          contentArea.removeEventListener('input', handleEditorChange);
        }
        
        if (onFocus || onBlur) {
          const contentArea = editor.getContentArea();
          if (onFocus) contentArea.removeEventListener('focus', onFocus);
          if (onBlur) contentArea.removeEventListener('blur', onBlur);
        }
        
        // Destroy the editor
        editor.destroy();
        editorRef.current = null;
      }
    };
  }, []);
  
  // Update content when value prop changes (for controlled component)
  useEffect(() => {
    if (editorRef.current && value !== undefined && isEditorInitialized) {
      // Get current content
      const currentContent = editorRef.current.getContent();
      
      // Only update if the content has changed to avoid cursor jumping
      if (currentContent !== value) {
        editorRef.current.setContent(value);
      }
    }
  }, [value, isEditorInitialized]);
  
  // Update read-only state when prop changes
  useEffect(() => {
    if (editorRef.current && isEditorInitialized) {
      const contentArea = editorRef.current.getContentArea();
      contentArea.contentEditable = readOnly ? 'false' : 'true';
    }
  }, [readOnly, isEditorInitialized]);
  
  // Handle editor content changes
  const handleEditorChange = () => {
    if (editorRef.current && onChange) {
      const html = editorRef.current.getContent();
      onChange(html);
    }
  };
  
  // Add placeholder functionality
  const addPlaceholder = (editor: Editor, placeholderText: string) => {
    const contentArea = editor.getContentArea();
    
    // Add placeholder class and data attribute
    contentArea.classList.add('openrte-has-placeholder');
    contentArea.dataset.placeholder = placeholderText;
    
    // Add event listeners to show/hide placeholder
    const togglePlaceholder = () => {
      if (contentArea.textContent?.trim() === '') {
        contentArea.classList.add('openrte-empty');
      } else {
        contentArea.classList.remove('openrte-empty');
      }
    };
    
    // Initial check
    togglePlaceholder();
    
    // Listen for changes
    contentArea.addEventListener('input', togglePlaceholder);
    
    // Add CSS for placeholder
    const style = document.createElement('style');
    style.textContent = `
      .openrte-has-placeholder.openrte-empty:before {
        content: attr(data-placeholder);
        color: #999;
        position: absolute;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  };
  
  // Expose imperative methods via ref
  useImperativeHandle(ref, () => ({
    getContent: () => {
      return editorRef.current ? editorRef.current.getContent() : '';
    },
    setContent: (html: string) => {
      if (editorRef.current) {
        editorRef.current.setContent(html);
      }
    },
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    },
    getEditor: () => editorRef.current
  }));
  
  // Combine component style with width and height props
  const combinedStyle: React.CSSProperties = {
    ...style,
    width: width,
    height: height
  };
  
  return (
    <div 
      ref={containerRef} 
      className={`openrte-react-wrapper ${className}`}
      style={combinedStyle}
    />
  );
});

// Set display name for React DevTools
OpenRTE.displayName = 'OpenRTE';

export default OpenRTE;