import React, { useEffect, useRef } from 'react';
import { Editor } from '../../core/editor';
// Ensure this is a proper function component
export const OpenRTE = ({ initialContent, onChange }) => {
    const editorRef = useRef(null);
    const editorInstance = useRef(null);
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
            var _a;
            (_a = editorInstance.current) === null || _a === void 0 ? void 0 : _a.destroy();
        };
    }, [initialContent]);
    return React.createElement("div", { ref: editorRef, className: "openrte-container" });
};
