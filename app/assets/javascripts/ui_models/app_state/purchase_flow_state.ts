import { action, makeObservable, observable } from 'mobx';

export enum PurchaseFlowPane {
  SignIn,
  CreateAccount,
}

export class PurchaseFlowState {
  isOpen = false;
  currentPane = PurchaseFlowPane.CreateAccount;

  constructor() {
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
    this.isOpen = true;
  };

  closePurchaseFlow = (): void => {
    this.isOpen = false;
  };
}
