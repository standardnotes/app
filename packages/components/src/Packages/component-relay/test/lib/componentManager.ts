import {
  PermissionDialog,
  SNComponent,
  SNComponentManager,
  SNTheme,
} from '@standardnotes/snjs';

export class WebComponentManager extends SNComponentManager {
  presentPermissionsDialog(dialog: PermissionDialog) {
    const permissions = JSON.stringify(dialog.permissions);
    const approved = window.confirm(permissions);
    dialog.callback(approved);
  }
}

export class MobileComponentManager extends SNComponentManager {
  private mobileActiveTheme?: SNTheme;

  presentPermissionsDialog(dialog: PermissionDialog) {
    const permissions = JSON.stringify(dialog.permissions);
    const approved = window.confirm(permissions);
    dialog.callback(approved);
  }

  /** @override */
  urlForComponent(component: SNComponent) {
    if (component.isTheme()) {
      const encoded = encodeURI(component.hosted_url);
      return `data:text/css;base64,${encoded}`;
    } else {
      return super.urlForComponent(component);
    }
  }

  public setMobileActiveTheme(theme: SNTheme) {
    this.mobileActiveTheme = theme;
    this.postActiveThemesToAllComponents();
  }

  /** @override */
  getActiveThemes() {
    if (this.mobileActiveTheme) {
      return [this.mobileActiveTheme];
    } else {
      return [];
    }
  }
}
