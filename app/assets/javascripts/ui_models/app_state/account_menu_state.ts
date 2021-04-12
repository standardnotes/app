import { action, makeObservable, observable } from "mobx";

export class AccountMenuState {
  show = false;

  constructor() {
    makeObservable(this, {
      show: observable,
      setShow: action,
      toggleShow: action,
    });
  }

  setShow = (show: boolean): void => {
    this.show = show;
  }

  toggleShow = (): void => {
    this.show = !this.show;
  }
}
