import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { ContentType } from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { SNItem } from '@standardnotes/snjs/dist/@types/models/core/item';

export class AccountMenuState {
  show = false;
  signingOut = false;
  notesAndTags: SNItem[] = [];

  constructor(
    private application: WebApplication,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      show: observable,
      signingOut: observable,
      notesAndTags: observable,

      setShow: action,
      toggleShow: action,
      setSigningOut: action,

      notesAndTagsCount: computed
    });

    appEventListeners.push(
      this.application.streamItems(
        [ContentType.Note, ContentType.Tag],
        () => {
          runInAction(() => {
            this.notesAndTags = this.application.getItems([ContentType.Note, ContentType.Tag]);
          });
        }
      )
    );
  }

  setShow = (show: boolean): void => {
    this.show = show;
  };

  closeAccountMenu = (): void => {
    this.setShow(false);
  };

  setSigningOut = (signingOut: boolean): void => {
    this.signingOut = signingOut;
  };

  toggleShow = (): void => {
    this.show = !this.show;
  };

  get notesAndTagsCount(): number {
    return this.notesAndTags.length;
  }
}
