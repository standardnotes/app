import { OutgoingItemMessagePayload, NoteContent, DecryptedTransferPayload } from '@standardnotes/snjs';
import { EditorKitDelegate } from './EditorKitDelegate';
import { EditorKitOptions } from './EditorKitOptions';
declare type NoteMessagePayload = DecryptedTransferPayload<NoteContent> & OutgoingItemMessagePayload<NoteContent>;
export default class EditorKit {
    private delegate;
    private options;
    private componentRelay?;
    private note?;
    private ignoreNextTextChange?;
    constructor(delegate: EditorKitDelegate, options: EditorKitOptions);
    private connectToBridge;
    private configureFileSafe;
    /**
     * Called by consumer when the editor has a change/input event.
     */
    onEditorValueChanged(text: string): void;
    /**
     * saveItemWithPresave from the component relay.
     */
    saveItemWithPresave(note: NoteMessagePayload, presave?: () => void): void;
    /**
     * Gets the current platform where the component is running.
     */
    get platform(): string | undefined;
    /**
     * Gets the current environment where the component is running.
     */
    get environment(): string | undefined;
    getComponentDataValueForKey(key: string): any;
    setComponentDataValueForKey(key: string, value: any): void;
    isRunningInMobileApplication(): boolean;
}
export {};
