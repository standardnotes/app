import { UuidString } from "@standardnotes/snjs";
import { action, makeObservable, observable } from "mobx";

export class ActionsMenuState {
  hiddenExtensions: Record<UuidString, boolean> = {};

  constructor() {
    makeObservable(this, {
      hiddenExtensions: observable,
      toggleExtensionVisibility: action,
      reset: action,
    });
  }

  toggleExtensionVisibility = (uuid: UuidString): void => {
    this.hiddenExtensions[uuid] = !this.hiddenExtensions[uuid];
  }

  reset = (): void => {
    this.hiddenExtensions = {};
  }
}
