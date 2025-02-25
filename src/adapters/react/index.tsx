// src/adapters/react/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '../../core/editor';
import { ContentModel } from '../../types/contentModel';

interface OpenRTEProps {
  initialContent?: ContentModel;
  onChange?: (content: ContentModel) => void;
  onHtmlChange?: (html: string) => void;
}

export const OpenRTE: React.FC<OpenRTEProps> = ({ 
  initialContent, 
  onChange,
  onHtmlChange 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<Editor | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Initialize editor on mount
  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new Editor(editorRef.current);
      
      if (initialContent) {
        editorInstance.current.setContent(initialContent);
      }
      
      setIsReady(true);
      console.log('Editor initialized:', editorInstance.current);
    }

    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, []);

  // Handle content changes
  useEffect(() => {
    if (isReady && editorInstance.current) {
      // Set up a mutation observer to detect changes
      const contentElement = editorRef.current?.querySelector('.openrte-content');
      
      if (contentElement && (onChange || onHtmlChange)) {
        const observer = new MutationObserver(() => {
          const editor = editorInstance.current;
          if (editor) {
            if (onChange) {
              onChange(editor.getContent());
            }
            if (onHtmlChange) {
              onHtmlChange(editor.getHtml());
            }
          }
        });
        
        observer.observe(contentElement, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: true
        });
        
        return () => observer.disconnect();
      }
    }
  }, [isReady, onChange, onHtmlChange]);

  // Update content when initialContent changes
  useEffect(() => {
    if (isReady && editorInstance.current && initialContent) {
      editorInstance.current.setContent(initialContent);
    }
  }, [initialContent, isReady]);

  return <div ref={editorRef} className="openrte-container" />;
};