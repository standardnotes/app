class PanelResizer {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/panel-resizer.html";
    this.scope = {
      index: "=",
      panelId: "=",
      onResize: "&",
      control: "="
    };
  }

  link(scope, elem, attrs, ctrl) {
    scope.elem = elem;

    scope.control.setWidth = function(width) {
      scope.setWidth(width, true);
    }
  }

  controller($scope, $element, modelManager, extensionManager) {
    'ngInject';

    let panel = document.getElementById($scope.panelId);
    let columnResizer = $element[0];
    let resizerWidth = columnResizer.offsetWidth;
    let minWidth = resizerWidth;

    $scope.setWidth = function(width, finish) {
      panel.style.flexBasis = width + "px";
      panel.style.width = width + "px";
      lastWidth = width;

      if(finish) {
        $scope.finishSettingWidth();
      }
    }

    $scope.finishSettingWidth = function() {
      if(lastWidth <= minWidth) {
        collapsed = true;
      } else {
        collapsed = false;
      }
      if(collapsed) {
        columnResizer.classList.add("collapsed");
      } else {
        columnResizer.classList.remove("collapsed");
      }
    }

    var pressed = false;
    var startWidth, startX, lastDownX, collapsed, lastWidth;


    columnResizer.addEventListener("mousedown", function(event){
      pressed = true;
      lastDownX = event.clientX;
      startWidth = panel.scrollWidth;
      columnResizer.classList.add("dragging");
      panel.classList.add("no-selection");
    })

    document.addEventListener("mousemove", function(event){
      if(!pressed) {
        return;
      }

      var rect = panel.getBoundingClientRect();
      var parentRect = panel.parentNode.getBoundingClientRect();
      var panelMaxX = rect.left + (startWidth || panel.style.maxWidth);

      var x = event.clientX;
      if(x > parentRect.width - resizerWidth) {
        x = parentRect.width - resizerWidth;
      }

      let deltaX = x - lastDownX;
      var newWidth = startWidth + deltaX;

      if(newWidth < minWidth) {
        newWidth = minWidth;
      }

      $scope.setWidth(newWidth, false);
    })

    document.addEventListener("mouseup", function(event){
      if(pressed) {
        pressed = false;
        columnResizer.classList.remove("dragging");
        panel.classList.remove("no-selection");

        $scope.onResize()(lastWidth);

        $scope.finishSettingWidth();
      }
    })
  }

}

angular.module('app.frontend').directive('panelResizer', () => new PanelResizer);
