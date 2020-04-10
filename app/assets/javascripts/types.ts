export class WebDirective implements ng.IDirective {
  controller?: string | ng.Injectable<ng.IControllerConstructor>;
  controllerAs?: string;
  bindToController?: boolean | { [boundProperty: string]: string };
  restrict?: string;
  scope?: boolean | { [boundProperty: string]: string };
  template?: string | ((tElement: any, tAttrs: any) => string);
}

export enum PasswordWizardType {
  ChangePassword = 1,
  AccountUpgrade = 2
}

export interface PasswordWizardScope extends Partial<ng.IScope> {
  type: PasswordWizardType,
  application: any
}