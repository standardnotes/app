import { SFPredicate, SFItem } from 'snjs';

export const PREF_TAGS_PANEL_WIDTH         = 'tagsPanelWidth';
export const PREF_NOTES_PANEL_WIDTH        = 'notesPanelWidth';
export const PREF_EDITOR_WIDTH             = 'editorWidth';
export const PREF_EDITOR_LEFT              = 'editorLeft';
export const PREF_EDITOR_MONOSPACE_ENABLED = 'monospaceFont';
export const PREF_EDITOR_SPELLCHECK        = 'spellcheck';
export const PREF_EDITOR_RESIZERS_ENABLED  = 'marginResizersEnabled';
export const PREF_SORT_NOTES_BY            = 'sortBy';
export const PREF_SORT_NOTES_REVERSE       = 'sortReverse';
export const PREF_NOTES_SHOW_ARCHIVED      = 'showArchived';
export const PREF_NOTES_HIDE_PINNED        = 'hidePinned';
export const PREF_NOTES_HIDE_NOTE_PREVIEW  = 'hideNotePreview';
export const PREF_NOTES_HIDE_DATE          = 'hideDate';
export const PREF_NOTES_HIDE_TAGS          = 'hideTags';

export class PreferencesManager {
  /* @ngInject */
  constructor(
    modelManager,
    singletonManager,
    appState,
    syncManager
  ) {
    this.singletonManager = singletonManager;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.appState = appState;

    this.modelManager.addItemSyncObserver(
      'user-prefs',
      'SN|UserPreferences',
      (allItems, validItems, deletedItems, source, sourceKey) => {
        this.preferencesDidChange();
      }
    );
  }

  load() {
    const prefsContentType = 'SN|UserPreferences';
    const contentTypePredicate = new SFPredicate(
      'content_type',
       '=',
       prefsContentType
     );
    this.singletonManager.registerSingleton(
      [contentTypePredicate],
      (resolvedSingleton) => {
        this.userPreferences = resolvedSingleton;
      },
      (valueCallback) => {
        // Safe to create. Create and return object.
        const prefs = new SFItem({content_type: prefsContentType});
        this.modelManager.addItem(prefs);
        this.modelManager.setItemDirty(prefs);
        this.syncManager.sync();
        valueCallback(prefs);
      }
    );
  }

  preferencesDidChange() {
    this.appState.setUserPreferences(this.userPreferences);
  }

  syncUserPreferences() {
    if(this.userPreferences) {
      this.modelManager.setItemDirty(this.userPreferences);
      this.syncManager.sync();
    }
  }

  getValue(key, defaultValue) {
    if(!this.userPreferences) { return defaultValue; }
    const value = this.userPreferences.getAppDataItem(key);
    return (value !== undefined && value != null) ? value : defaultValue;
  }

  setUserPrefValue(key, value, sync) {
    this.userPreferences.setAppDataItem(key, value);
    if(sync) {
      this.syncUserPreferences();
    }
  }
}
