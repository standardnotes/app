class ComponentManager extends SNComponentManager {
  constructor(modelManager, syncManager, desktopManager, nativeExtManager, $rootScope, $timeout, $compile) {
    super({
      modelManager,
      syncManager,
      desktopManager,
      nativeExtManager,
      alertManager: new SFAlertManager(),
      $uiRunner: $rootScope.safeApply,
      $timeout: $timeout,
      environment: isDesktopApplication() ? "desktop" : "web",
      platform: getPlatformString()
    });

    // this.loggingEnabled = true;

    this.$compile = $compile;
    this.$rootScope = $rootScope;
  }

  openModalComponent(component) {
    var scope = this.$rootScope.$new(true);
    scope.component = component;
    var el = this.$compile( "<component-modal component='component' class='sk-modal'></component-modal>" )(scope);
    angular.element(document.body).append(el);
  }

  presentPermissionsDialog(dialog) {
    let scope = this.$rootScope.$new(true);
    scope.permissionsString = dialog.permissionsString;
    scope.component = dialog.component;
    scope.callback = dialog.callback;

    var el = this.$compile( "<permissions-modal component='component' permissions-string='permissionsString' callback='callback' class='sk-modal'></permissions-modal>" )(scope);
    angular.element(document.body).append(el);
  }
}

angular.module('app').service('componentManager', ComponentManager);
