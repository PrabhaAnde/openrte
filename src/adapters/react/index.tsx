import React, { useEffect, useRef } from 'react';
import { Editor } from '../../core/editor';
import { ContentModel } from '../../types/contentModel';

interface OpenRTEProps {
  initialContent?: ContentModel;
  onChange?: (content: ContentModel) => void;
}

// Ensure this is a proper function component
export const OpenRTE: React.FC<OpenRTEProps> = ({ initialContent, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<Editor | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorInstance.current = new Editor(editorRef.current);

      if (initialContent) {
        editorInstance.current.setContent(initialContent);
      }
    }

    // Log to verify initialization
    console.log('Editor initialized:', editorInstance.current);

    return () => {
      editorInstance.current?.destroy();
    };
  }, [initialContent]);

  return <div ref={editorRef} className="openrte-container" />;
};