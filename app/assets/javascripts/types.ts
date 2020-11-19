import { SNComponent } from '@standardnotes/snjs';
export class WebDirective implements ng.IDirective {
  controller?: string | ng.Injectable<ng.IControllerConstructor>;
  controllerAs?: string;
  bindToController?: boolean | { [boundProperty: string]: string };
  restrict?: string;
  replace?: boolean
  scope?: boolean | { [boundProperty: string]: string };
  template?: string | ((tElement: any, tAttrs: any) => string)
  transclude?: boolean
}

export enum PasswordWizardType {
  ChangePassword = 1,
  AccountUpgrade = 2
}

export interface PasswordWizardScope extends Partial<ng.IScope> {
  type: PasswordWizardType,
  application: any
}

export interface PermissionsModalScope extends Partial<ng.IScope> {
  application: any
  component: SNComponent
  permissionsString: string
  callback: (approved: boolean) => void
}

export interface AccountSwitcherScope extends Partial<ng.IScope> {
  application: any
}

export type PanelPuppet = {
  onReady?: () => void
  ready?: boolean
  setWidth?: (width: number) => void
  setLeft?: (left: number) => void
  isCollapsed?: () => boolean
  flash?: () => void
}

export type FooterStatus = {
  string: string
}
