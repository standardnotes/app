import { action, makeObservable, observable } from "mobx";
import { WebApplication } from '@/ui_models/application';

export class AccountMenuState2 {
  show = false;
  signingOut = false;

  constructor(
    // private application: WebApplication,
    // appEventListeners: (() => void)[]
  ) {
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
