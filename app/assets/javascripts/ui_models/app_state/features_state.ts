import {
  ApplicationEvent,
  FeatureIdentifier,
  FeatureStatus,
} from '@standardnotes/snjs';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import { WebApplication } from '../application';

export const TAG_FOLDERS_FEATURE_NAME = 'Tag folders';
export const TAG_FOLDERS_FEATURE_TOOLTIP =
  'A Plus or Pro plan is required to enable Tag folders.';

/**
 * Holds state for premium/non premium features for the current user features,
 * and eventually for in-development features (feature flags).
 */
export class FeaturesState {
  readonly enableUnfinishedFeatures: boolean =
    window?._enable_unfinished_features;

  _hasFolders = false;
  private unsub: () => void;

  constructor(private application: WebApplication) {
    this._hasFolders = this.hasNativeFolders();

    makeObservable(this, {
      _hasFolders: observable,
      hasFolders: computed,
      enableNativeFoldersFeature: computed,
    });

    this.unsub = this.application.addEventObserver(async (eventName) => {
      switch (eventName) {
        case ApplicationEvent.FeaturesUpdated:
        case ApplicationEvent.Launched:
          runInAction(() => {
            this._hasFolders = this.hasNativeFolders();
          });
          break;
        default:
          break;
      }
    });
  }

  public deinit() {
    this.unsub();
  }

  public get enableNativeFoldersFeature(): boolean {
    return this.enableUnfinishedFeatures;
  }

  public get enableNativeSmartTagsFeature(): boolean {
    return this.enableUnfinishedFeatures;
  }

  public get hasFolders(): boolean {
    return this._hasFolders;
  }

  public set hasFolders(hasFolders: boolean) {
    if (!hasFolders) {
      this._hasFolders = false;
      return;
    }

    if (!this.hasNativeFolders()) {
      this.application.alertService?.alert(
        `${TAG_FOLDERS_FEATURE_NAME} requires at least a Plus Subscription.`
      );
      this._hasFolders = false;
      return;
    }

    this._hasFolders = hasFolders;
  }

  private hasNativeFolders(): boolean {
    if (!this.enableNativeFoldersFeature) {
      return false;
    }

    const status = this.application.getFeatureStatus(
      FeatureIdentifier.TagNesting
    );

    return status === FeatureStatus.Entitled;
  }
}
