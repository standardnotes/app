export enum PasswordWizardType {
  ChangePassword = 1,
  AccountUpgrade = 2,
}

export type PanelPuppet = {
  onReady?: () => void;
  ready?: boolean;
  setWidth?: (width: number) => void;
  setLeft?: (left: number) => void;
  isCollapsed?: () => boolean;
  flash?: () => void;
};

export type FooterStatus = {
  string: string;
};
