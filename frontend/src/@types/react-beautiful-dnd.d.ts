declare module 'react-beautiful-dnd' {
    import * as React from 'react';
    
    // 拖拽上下文
    export interface DragDropContextProps {
        onDragEnd: (result: DropResult) => void;
        onDragStart?: (initial: DragStart) => void;
        onDragUpdate?: (update: DragUpdate) => void;
        children: React.ReactNode;
    }
    
    export const DragDropContext: React.FC<DragDropContextProps>;
    
    // 可拖拽项
    export interface DraggableProps {
        draggableId: string;
        index: number;
        isDragDisabled?: boolean;
        disableInteractiveElementBlocking?: boolean;
        children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactNode;
    }
    
    export const Draggable: React.FC<DraggableProps>;
    
    // 放置区域
    export interface DroppableProps {
        droppableId: string;
        type?: string;
        isDropDisabled?: boolean;
        direction?: 'horizontal' | 'vertical';
        children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactNode;
    }
    
    export const Droppable: React.FC<DroppableProps>;
    
    // 提供给Draggable子项的属性
    export interface DraggableProvided {
        draggableProps: {
            style?: React.CSSProperties;
            'data-rbd-draggable-context-id': string;
            'data-rbd-draggable-id': string;
            [key: string]: any;
        };
        dragHandleProps: {
            role: string;
            'aria-grabbed': boolean;
            tabIndex: number;
            'data-rbd-drag-handle-draggable-id': string;
            'data-rbd-drag-handle-context-id': string;
            [key: string]: any;
        } | null;
        innerRef: (element: HTMLElement | null) => void;
    }
    
    // Draggable状态快照
    export interface DraggableStateSnapshot {
        isDragging: boolean;
        isDropAnimating: boolean;
        draggingOver: string | null;
        dropAnimation: {
            duration: number;
            curve: string;
            moveTo: {
                x: number;
                y: number;
            };
        } | null;
    }
    
    // 提供给Droppable子项的属性
    export interface DroppableProvided {
        innerRef: (element: HTMLElement | null) => void;
        droppableProps: {
            'data-rbd-droppable-id': string;
            'data-rbd-droppable-context-id': string;
            [key: string]: any;
        };
        placeholder?: React.ReactNode;
    }
    
    // Droppable状态快照
    export interface DroppableStateSnapshot {
        isDraggingOver: boolean;
        draggingOverWith: string | null;
        draggingFromThisWith: string | null;
    }
    
    // 拖拽开始时的信息
    export interface DragStart {
        draggableId: string;
        type: string;
        source: {
            droppableId: string;
            index: number;
        };
        mode: 'FLUID' | 'SNAP';
    }
    
    // 拖拽更新时的信息
    export interface DragUpdate extends DragStart {
        destination?: {
            droppableId: string;
            index: number;
        };
        combine?: {
            draggableId: string;
            droppableId: string;
        };
    }
    
    // 拖拽结束时的结果
    export interface DropResult extends DragUpdate {
        reason: 'DROP' | 'CANCEL';
    }
} 