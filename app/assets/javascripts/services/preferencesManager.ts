import { WebApplication } from '@/application';
import {
  SNPredicate,
  ContentType,
  ApplicationService,
  SNUserPrefs,
  WebPrefKey,
  UserPrefsMutator
} from 'snjs';
import { FillItemContent } from '@/../../../../snjs/dist/@types/models/generator';

export class PreferencesManager extends ApplicationService {

  private userPreferences!: SNUserPrefs

  /** @override */
  async onAppLaunch() {
    super.onAppLaunch();
    this.streamPreferences();
    this.loadSingleton();
  }

  get webApplication() {
    return this.application as WebApplication;
  }

  streamPreferences() {
    this.application!.streamItems(
      ContentType.UserPrefs,
      () => {
        this.loadSingleton();
      }
    );
  }

  async loadSingleton() {
    const contentType = ContentType.UserPrefs;
    const predicate = new SNPredicate('content_type', '=', contentType);
    this.userPreferences = (await this.application!.singletonManager!.findOrCreateSingleton(
      predicate,
      contentType,
      FillItemContent({})
    )) as SNUserPrefs;
    this.preferencesDidChange();
  }

  preferencesDidChange() {
    this.webApplication.getAppState().setUserPreferences(this.userPreferences);
  }

  syncUserPreferences() {
    if (this.userPreferences) {
      this.application!.saveItem(this.userPreferences.uuid);
    }
  }

  getValue(key: WebPrefKey, defaultValue?: any) {
    if (!this.userPreferences) { return defaultValue; }
    const value = this.userPreferences.getPref(key);
    return (value !== undefined && value !== null) ? value : defaultValue;
  }

  setUserPrefValue(key: WebPrefKey, value: any, sync = false) {
    this.application!.changeItem(
      this.userPreferences.uuid,
      (m) => {
        const mutator = m as UserPrefsMutator;
        mutator.setWebPref(key, value);
      }
    )
    if (sync) {
      this.syncUserPreferences();
    }
  }
}
