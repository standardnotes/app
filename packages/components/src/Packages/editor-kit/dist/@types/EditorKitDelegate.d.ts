import { OutgoingItemMessagePayload } from '@standardnotes/snjs';
/**
 * The delegate is responsible for responding to events and functions that the EditorKit requires.
 * For example, when EditorKit wants to insert a new HTML element, it won't neccessarily know how,
 * because it's not designed for any particular editor. Instead, it will tell the delegate to
 * insert the element. The consumer of this API, the actual editor, would configure this delegate
 * with the appropriate callbacks.
 */
export interface EditorKitDelegate {
    insertRawText?: (text: string) => void;
    setEditorRawText: (text: string) => void;
    clearUndoHistory?: () => void;
    generateCustomPreview?: (text: string) => {
        html?: string;
        plain: string;
    };
    onNoteLockToggle?: (isLocked: boolean) => void;
    onNoteValueChange?: (note: OutgoingItemMessagePayload) => Promise<void>;
    onThemesChange?: () => void;
    handleRequestForContentHeight: () => number | undefined;
}
