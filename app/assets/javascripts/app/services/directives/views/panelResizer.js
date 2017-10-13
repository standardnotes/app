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
    var startWidth, startX, lastDownX;

    var columnResizer = $element[0];
    var resizerWidth = columnResizer.offsetWidth;

    var safetyOffset = 15;

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
      var panelMaxX = rect.left + (panel.style.maxWidth || startWidth);

      var x = event.clientX;
      // if(x < resizerWidth/2 + safetyOffset) {
      //   x = resizerWidth/2 + safetyOffset;
      // } else if(x > panelMaxX - resizerWidth - safetyOffset) {
      //   x = panelMaxX - resizerWidth - safetyOffset;
      // }

      var colLeft = x - resizerWidth/2;
      columnResizer.style.left = colLeft + "px";

      console.log("width:", panelMaxX, "x:", x, "new width:", colLeft-safetyOffset);


      // panel.style.maxWidth = (colLeft - safetyOffset) + "px";
    })

    document.addEventListener("mouseup", function(event){
      if(pressed) {
        pressed = false;
        columnResizer.classList.remove("dragging");
        panel.classList.remove("no-selection");
      }
    })
  }

}

angular.module('app.frontend').directive('panelResizer', () => new PanelResizer);
