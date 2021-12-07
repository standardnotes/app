import {
  ApplicationEvent,
  FeatureIdentifier,
  FeatureStatus,
} from '@standardnotes/snjs';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import { WebApplication } from '../application';

/**
 * Holds state for premium / non premium features,
 * For the current user features,
 * And eventually for in-development features (feature flags).
 */
export class FeaturesState {
  _hasFolders = false;
  private unsub: () => void;

  constructor(private application: WebApplication) {
    this._hasFolders = this.hasFolderFeature();

    makeObservable(this, {
      _hasFolders: observable,
      hasFolders: computed,
    });

    this.unsub = this.application.addEventObserver(async () => {
      runInAction(() => {
        this._hasFolders = this.hasFolderFeature();
      });
    }, ApplicationEvent.FeaturesUpdated);
  }

  public deinit() {
    this.unsub();
  }

  public hasFolderFeature(): boolean {
    const status = this.application.getFeatureStatus(
      FeatureIdentifier.TagNesting
    );
    return status === FeatureStatus.Entitled;
  }

  public get hasFolders(): boolean {
    return this._hasFolders;
  }

  public set hasFolders(hasFolders: boolean) {
    if (!hasFolders) {
      this._hasFolders = false;
      return;
    }

    if (!this.hasFolderFeature()) {
      this.application.alertService?.alert(
        'Tag Folders requires at least a Plus Subscription.'
      );
      this._hasFolders = false;
      return;
    }

    this._hasFolders = hasFolders;
  }
}
