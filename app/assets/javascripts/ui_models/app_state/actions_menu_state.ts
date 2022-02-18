import { UuidString } from '@standardnotes/snjs';
import { action, makeObservable, observable } from 'mobx';

export class ActionsMenuState {
  hiddenSections: Record<UuidString, boolean> = {};

  constructor() {
    makeObservable(this, {
      hiddenSections: observable,
      toggleSectionVisibility: action,
      reset: action,
    });
  }

  toggleSectionVisibility = (uuid: UuidString): void => {
    this.hiddenSections[uuid] = !this.hiddenSections[uuid];
  };

  reset = (): void => {
    this.hiddenSections = {};
  };
}
