import { WebApplication } from '@/ui_models/application';
import {
  SNPredicate,
  ContentType,
  ApplicationService,
  SNUserPrefs,
  WebPrefKey,
  UserPrefsMutator,
  FillItemContent
} from 'snjs';

export class PreferencesManager extends ApplicationService {

  private userPreferences!: SNUserPrefs
  private loadingPrefs = false;

  /** @override */
  async onAppLaunch() {
    super.onAppLaunch();
    this.streamPreferences();
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

  private async loadSingleton() {
    if(this.loadingPrefs) {
      return;
    }
    this.loadingPrefs = true;
    const contentType = ContentType.UserPrefs;
    const predicate = new SNPredicate('content_type', '=', contentType);
    const previousRef = this.userPreferences;
    this.userPreferences = (await this.application!.singletonManager!.findOrCreateSingleton(
      predicate,
      contentType,
      FillItemContent({})
    )) as SNUserPrefs;
    this.loadingPrefs = false;
    const didChange = !previousRef || (
      this.userPreferences.lastSyncBegan?.getTime() !== previousRef?.lastSyncBegan?.getTime()
    )
    if (didChange) {
      this.webApplication.getAppState().setUserPreferences(this.userPreferences);
    }
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

  async setUserPrefValue(key: WebPrefKey, value: any, sync = false) {
    await this.application!.changeItem(
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
