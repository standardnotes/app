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
        console.log("Rooms:", $scope.rooms);
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
      if(action === "set-size") {
        console.log("Set size event", data);
        var setSize = function(element, size) {
          var widthString = typeof size.width === 'string' ? size.width : `${data.width}px`;
          var heightString = typeof size.height === 'string' ? size.height : `${data.height}px`;
          element.setAttribute("style", `width:${widthString}; height:${heightString}; `);
        }

        if(data.type === "content") {
          var iframe = componentManager.iframeForComponent(component);
          var width = data.width;
          var height = data.height;
          iframe.width  = width;
          iframe.height = height;

          setSize(iframe, data);
        } else {
          var container = document.getElementById("room-" + component.uuid);
          setSize(container, data);
        }
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
