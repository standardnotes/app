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

    var safetyOffset = 0;

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
      if(x < resizerWidth/2 + safetyOffset) {
        x = safetyOffset;
      } else if(x > parentRect.width - resizerWidth - safetyOffset) {
        x = parentRect.width - resizerWidth - safetyOffset;
      } else if(x < 0) {
        x = 0;
      }

      let deltaX = x - lastDownX;
      let newWidth = startWidth + deltaX;

      if(newWidth < 0) {
        newWidth = 0;
      }

      panel.style.flexBasis = newWidth + "px";
      panel.style.width = newWidth + "px";
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
