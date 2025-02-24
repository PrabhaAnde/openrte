import React, { useEffect, useRef } from 'react';
import { Editor } from '../../core/editor';
import { ContentModel } from '../../types/contentModel';

interface OpenRTEProps {
  initialContent?: ContentModel;
  onChange?: (content: ContentModel) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  className?: string;
  style?: React.CSSProperties;
  height?: string | number;
}

// React component for the rich text editor
export const OpenRTE: React.FC<OpenRTEProps> = ({ 
  initialContent, 
  onChange, 
  onFocus, 
  onBlur, 
  autoFocus,
  className = '',
  style = {},
  height = '300px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<Editor | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorInstance.current = new Editor(editorRef.current);

      if (initialContent) {
        editorInstance.current.setContent(initialContent);
      }

      // Set focus if autoFocus is true
      if (autoFocus && editorRef.current) {
        const contentArea = editorRef.current.querySelector('.openrte-content');
        if (contentArea) {
          (contentArea as HTMLElement).focus();
        }
      }
    }

    // Log to verify initialization
    console.log('Editor initialized:', editorInstance.current);

    return () => {
      // Clean up
      editorInstance.current?.destroy();
    };
  }, [initialContent, autoFocus]);

  // Set up event handlers for focus/blur
  useEffect(() => {
    const contentArea = editorRef.current?.querySelector('.openrte-content');
    if (contentArea) {
      if (onFocus) {
        contentArea.addEventListener('focus', onFocus);
      }
      if (onBlur) {
        contentArea.addEventListener('blur', onBlur);
      }
    }

    return () => {
      // Clean up event listeners
      if (contentArea) {
        if (onFocus) {
          contentArea.removeEventListener('focus', onFocus);
        }
        if (onBlur) {
          contentArea.removeEventListener('blur', onBlur);
        }
      }
    };
  }, [onFocus, onBlur]);

  // Set up content change detection
  useEffect(() => {
    if (onChange && editorRef.current) {
      const contentArea = editorRef.current.querySelector('.openrte-content');
      if (contentArea) {
        const handleChange = () => {
          if (editorInstance.current) {
            onChange(editorInstance.current.getContent());
          }
        };
        
        contentArea.addEventListener('input', handleChange);
        
        return () => {
          contentArea.removeEventListener('input', handleChange);
        };
      }
    }
  }, [onChange]);

  return (
    <div 
      ref={editorRef} 
      className={`openrte-container ${className}`}
      style={{
        ...style,
        height: typeof height === 'number' ? `${height}px` : height
      }} 
    />
  );
};