import { action, makeObservable, observable } from 'mobx';
import { WebApplication } from '../application';

export enum PurchaseFlowPane {
  SignIn,
  CreateAccount,
}

export class PurchaseFlowState {
  isOpen = false;
  currentPane = PurchaseFlowPane.CreateAccount;

  constructor(private application: WebApplication) {
    makeObservable(this, {
      isOpen: observable,
      currentPane: observable,

      setCurrentPane: action,
      openPurchaseFlow: action,
      closePurchaseFlow: action,
    });
  }

  setCurrentPane = (currentPane: PurchaseFlowPane): void => {
    this.currentPane = currentPane;
  };

  openPurchaseFlow = (): void => {
    const user = this.application.getUser();
    if (!user) {
      this.isOpen = true;
    }
  };

  closePurchaseFlow = (): void => {
    this.isOpen = false;
  };
}
