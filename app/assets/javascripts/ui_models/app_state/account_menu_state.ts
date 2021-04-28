import { action, makeObservable, observable } from "mobx";

export class AccountMenuState {
  show = false;
  signingOut = false;

  constructor() {
    makeObservable(this, {
      show: observable,
      signingOut: observable,

      setShow: action,
      toggleShow: action,
      setSigningOut: action,
    });
  }

  setShow = (show: boolean): void => {
    this.show = show;
  }

  setSigningOut = (signingOut: boolean): void => {
    this.signingOut = signingOut;
  }

  toggleShow = (): void => {
    this.show = !this.show;
  }
}
