class RoomBar {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/room-bar.html";
    this.scope = {
    };
  }

  controller($rootScope, $scope, extensionManager, syncManager, modelManager, componentManager, $timeout) {
    'ngInject';

    $scope.extensionManager = extensionManager;
    $scope.componentManager = componentManager;

    $rootScope.$on("initial-data-loaded", () => {
      $timeout(() => {
        $scope.rooms = componentManager.componentsForArea("rooms");
        console.log("Rooms:", $scope.rooms);
      })
    });

  }


}

angular.module('app.frontend').directive('roomBar', () => new RoomBar);
