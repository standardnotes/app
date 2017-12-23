class RoomBar {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/room-bar.html";
    this.scope = {
    };
  }

  controller($rootScope, $scope, desktopManager, syncManager, modelManager, componentManager, $timeout) {
    'ngInject';

    $scope.componentManager = componentManager;

    $rootScope.$on("initial-data-loaded", () => {
      $timeout(() => {
        $scope.rooms = componentManager.componentsForArea("rooms");
      })
    });

    componentManager.registerHandler({identifier: "roomBar", areas: ["rooms"], activationHandler: function(component){
      if(component.active) {
        $timeout(function(){
          var iframe = componentManager.iframeForComponent(component);
          if(iframe) {
            iframe.onload = function() {
              componentManager.registerComponentWindow(component, iframe.contentWindow);
            }.bind(this);
          }
        }.bind(this));
      }
    }.bind(this), actionHandler: function(component, action, data){
      if(action == "set-size") {
        componentManager.handleSetSizeEvent(component, data);
      }
    }.bind(this)});

    $scope.selectRoom = function(room) {
      room.show = !room.show;
      if(room.show) {
        this.componentManager.activateComponent(room);
      } else {
        this.componentManager.deactivateComponent(room);
      }
    }

  }


}

angular.module('app.frontend').directive('roomBar', () => new RoomBar);
