export interface VNode {
    type: string;
    props: {
        [key: string]: any;
    };
    children: (VNode | string)[];
}
export declare function h(type: string, props?: {
    [key: string]: any;
}, children?: (VNode | string)[]): VNode;
export declare function patch(node: Element | VNode, vnode: VNode): Element;
