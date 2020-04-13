export declare enum KeyboardKey {
    Tab = "Tab",
    Backspace = "Backspace",
    Up = "ArrowUp",
    Down = "ArrowDown"
}
export declare enum KeyboardModifier {
    Shift = "Shift",
    Ctrl = "Control",
    /** ⌘ key on Mac, ⊞ key on Windows */
    Meta = "Meta",
    Alt = "Alt"
}
declare enum KeyboardKeyEvent {
    Down = "KeyEventDown",
    Up = "KeyEventUp"
}
declare type KeyboardObserver = {
    key?: KeyboardKey | string;
    modifiers?: KeyboardModifier[];
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;
    element?: HTMLElement;
    elements?: HTMLElement[];
    notElement?: HTMLElement;
    notElementIds?: string[];
};
export declare class KeyboardManager {
    private observers;
    private handleKeyDown;
    private handleKeyUp;
    constructor();
    deinit(): void;
    modifiersForEvent(event: KeyboardEvent): KeyboardModifier[];
    eventMatchesKeyAndModifiers(event: KeyboardEvent, key: KeyboardKey | string, modifiers?: KeyboardModifier[]): boolean;
    notifyObserver(event: KeyboardEvent, keyEvent: KeyboardKeyEvent): void;
    addKeyObserver(observer: KeyboardObserver): () => void;
}
export {};
