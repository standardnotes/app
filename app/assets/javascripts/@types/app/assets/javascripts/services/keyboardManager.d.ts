export namespace KeyboardKeys {
    export const Tab: string;
    export const Backspace: string;
    export const Up: string;
    export const Down: string;
}
export namespace KeyboardModifiers {
    export const Shift: string;
    export const Ctrl: string;
    export const Meta: string;
    export const Alt: string;
}
export class KeyboardManager {
    observers: any[];
    handleKeyDown(event: any): void;
    handleKeyUp(event: any): void;
    /** @access public */
    deinit(): void;
    modifiersForEvent(event: any): any[];
    eventMatchesKeyAndModifiers(event: any, key: any, modifiers?: any[]): boolean;
    notifyObserver(event: any, keyEventType: any): void;
    addKeyObserver({ key, modifiers, onKeyDown, onKeyUp, element, elements, notElement, notElementIds }: {
        key: any;
        modifiers: any;
        onKeyDown: any;
        onKeyUp: any;
        element: any;
        elements: any;
        notElement: any;
        notElementIds: any;
    }): {
        key: any;
        modifiers: any;
        onKeyDown: any;
        onKeyUp: any;
        element: any;
        elements: any;
        notElement: any;
        notElementIds: any;
    };
    removeKeyObserver(observer: any): void;
}
