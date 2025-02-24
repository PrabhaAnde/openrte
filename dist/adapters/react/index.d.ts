import React from 'react';
import { ContentModel } from '../../types/contentModel';
interface OpenRTEProps {
    initialContent?: ContentModel;
    onChange?: (content: ContentModel) => void;
}
export declare const OpenRTE: React.FC<OpenRTEProps>;
export {};
