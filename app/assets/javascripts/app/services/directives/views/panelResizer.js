class PanelResizer {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/panel-resizer.html";
    this.scope = {
      index: "=",
      panelId: "="
    };
  }

  link(scope, elem, attrs, ctrl) {
    scope.elem = elem;
  }

  controller($scope, $element, modelManager, extensionManager) {
    'ngInject';

    var panel = document.getElementById($scope.panelId);
    var pressed = false;
    var startWidth, startX, lastDownX, collapsed;

    var columnResizer = $element[0];
    var resizerWidth = columnResizer.offsetWidth;

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

      var minWidth = resizerWidth;

      var x = event.clientX;
      if(x > parentRect.width - resizerWidth) {
        x = parentRect.width - resizerWidth;
      }

      let deltaX = x - lastDownX;
      let newWidth = startWidth + deltaX;

      if(newWidth <= minWidth) {
        collapsed = true;
      } else {
        collapsed = false;
      }

      if(newWidth < minWidth) {
        newWidth = minWidth;
      }

      // console.log("New Width", newWidth, "Min Width", minWidth, "X", x);

      panel.style.flexBasis = newWidth + "px";
      panel.style.width = newWidth + "px";
    })

    document.addEventListener("mouseup", function(event){
      if(pressed) {
        pressed = false;
        columnResizer.classList.remove("dragging");
        panel.classList.remove("no-selection");

        if(collapsed) {
          columnResizer.classList.add("collapsed");
        } else {
          columnResizer.classList.remove("collapsed");
        }
      }
    })
  }

}

angular.module('app.frontend').directive('panelResizer', () => new PanelResizer);
