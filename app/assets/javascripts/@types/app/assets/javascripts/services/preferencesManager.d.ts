export namespace PrefKeys {
    export const TagsPanelWidth: string;
    export const NotesPanelWidth: string;
    export const EditorWidth: string;
    export const EditorLeft: string;
    export const EditorMonospaceEnabled: string;
    export const EditorSpellcheck: string;
    export const EditorResizersEnabled: string;
    export const SortNotesBy: string;
    export const SortNotesReverse: string;
    export const NotesShowArchived: string;
    export const NotesHidePinned: string;
    export const NotesHideNotePreview: string;
    export const NotesHideDate: string;
    export const NotesHideTags: string;
}
export class PreferencesManager extends ApplicationService {
    constructor(application: import("../../../../../snjs/dist/@types/application").SNApplication);
    /** @override */
    onAppLaunch(): void;
    streamPreferences(): void;
    loadSingleton(): Promise<void>;
    userPreferences: any;
    preferencesDidChange(): void;
    syncUserPreferences(): void;
    getValue(key: any, defaultValue: any): any;
    setUserPrefValue(key: any, value: any, sync: any): void;
}
import { ApplicationService } from "../../../../../../../../../../Users/mo/Desktop/sn/dev/snjs/dist/@types";
