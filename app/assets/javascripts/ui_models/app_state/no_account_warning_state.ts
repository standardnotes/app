import { storage, StorageKey } from "@/services/localStorage";
import { SNApplication, ApplicationEvent } from "@standardnotes/snjs";
import { runInAction, makeObservable, observable, action } from "mobx";

export class NoAccountWarningState {
  show: boolean;
  constructor(application: SNApplication, appObservers: (() => void)[]) {
    this.show = application.hasAccount()
      ? false
      : storage.get(StorageKey.ShowNoAccountWarning) ?? true;

    appObservers.push(
      application.addEventObserver(async () => {
        runInAction(() => {
          this.show = false;
        });
      }, ApplicationEvent.SignedIn),
      application.addEventObserver(async () => {
        if (application.hasAccount()) {
          runInAction(() => {
            this.show = false;
          });
        }
      }, ApplicationEvent.Started)
    );

    makeObservable(this, {
      show: observable,
      hide: action,
    });
  }

  hide = (): void => {
    this.show = false;
    storage.set(StorageKey.ShowNoAccountWarning, false);
  }

  reset = (): void => {
    storage.remove(StorageKey.ShowNoAccountWarning);
  }
}
