import {
  ApplicationEvents,
  SNPredicate,
  ContentTypes,
  CreateMaxPayloadFromAnyObject,
  ApplicationService
} from 'snjs';

export const PrefKeys = {
  TagsPanelWidth: 'tagsPanelWidth',
  NotesPanelWidth: 'notesPanelWidth',
  EditorWidth: 'editorWidth',
  EditorLeft: 'editorLeft',
  EditorMonospaceEnabled: 'monospaceFont',
  EditorSpellcheck: 'spellcheck',
  EditorResizersEnabled: 'marginResizersEnabled',
  SortNotesBy: 'sortBy',
  SortNotesReverse: 'sortReverse',
  NotesShowArchived: 'showArchived',
  NotesHidePinned: 'hidePinned',
  NotesHideNotePreview: 'hideNotePreview',
  NotesHideDate: 'hideDate',
  NotesHideTags: 'hideTags'
};

export class PreferencesManager extends ApplicationService {
  /* @ngInject */
  constructor(
    appState,
    application
  ) {
    super(application);
    this.appState = appState;
  }

  /** @override */
  onAppLaunch() {
    super.onAppLaunch();
    this.streamPreferences();
    this.loadSingleton();
  }

  streamPreferences() {
    this.application.streamItems({
      contentType: ContentTypes.UserPrefs,
      stream: () => {
        this.loadSingleton();
      }
    });
  }

  async loadSingleton() {
    const contentType = ContentTypes.UserPrefs;
    const predicate = new SNPredicate('content_type', '=', contentType);
    this.userPreferences = await this.application.singletonManager.findOrCreateSingleton({
      predicate: predicate,
      createPayload: CreateMaxPayloadFromAnyObject({
        object: {
          content_type: contentType,
          content: {}
        }
      })
    });
    this.preferencesDidChange();
  }

  preferencesDidChange() {
    this.appState.setUserPreferences(this.userPreferences);
  }

  syncUserPreferences() {
    if (this.userPreferences) {
      this.application.saveItem({ item: this.userPreferences });
    }
  }

  getValue(key, defaultValue) {
    if (!this.userPreferences) { return defaultValue; }
    const value = this.userPreferences.getAppDataItem(key);
    return (value !== undefined && value != null) ? value : defaultValue;
  }

  setUserPrefValue(key, value, sync) {
    this.userPreferences.setAppDataItem(key, value);
    if (sync) {
      this.syncUserPreferences();
    }
  }
}
