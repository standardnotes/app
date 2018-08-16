class PanelResizer {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/panel-resizer.html";
    this.scope = {
      index: "=",
      panelId: "=",
      onResize: "&",
      defaultWidth: "=",
      onResizeFinish: "&",
      control: "=",
      alwaysVisible: "=",
      minWidth: "=",
      property: "=",
      hoverable: "=",
      collapsable: "="
    };
  }

  link(scope, elem, attrs, ctrl) {
    scope.elem = elem;

    scope.control.setWidth = function(value) {
      scope.setWidth(value, true);
    }

    scope.control.setLeft = function(value) {
      scope.setLeft(value);
    }
  }

  controller($scope, $element, modelManager, actionsManager, $timeout) {
    'ngInject';

    let panel = document.getElementById($scope.panelId);
    if(!panel) {
      console.log("Panel not found for", $scope.panelId);
    }

    let resizerColumn = $element[0];
    let resizerWidth = resizerColumn.offsetWidth;
    let minWidth = $scope.minWidth || resizerWidth;
    var pressed = false;
    var startWidth = panel.scrollWidth, startX = 0, lastDownX = 0, collapsed, lastWidth = startWidth, startLeft, lastLeft;
    var appFrame;


    // Handle Double Click Event
    var widthBeforeLastDblClick = 0;
    panel.ondblclick = () => {
      var collapsed = $scope.isCollapsed();
      $timeout(() => {
        if(collapsed) {
          $scope.setWidth(widthBeforeLastDblClick || $scope.defaultWidth);
        } else {
          widthBeforeLastDblClick = lastWidth;
          $scope.setWidth(minWidth);
        }
        $scope.finishSettingWidth();
        $scope.onResizeFinish()(lastWidth, lastLeft, $scope.isAtMaxWidth());
      })
    }

    function getParentRect() {
      return panel.parentNode.getBoundingClientRect();
    }

    if($scope.property == "right") {
      let handleReize = debounce((event) => {
        reloadDefaultValues();
        handleWidthEvent();
        $timeout(() => { $scope.finishSettingWidth(); })
      }, 250);

      window.addEventListener('resize', handleReize);

      $scope.$on("$destroy", function() {
        window.removeEventListener('resize', handleReize);
      });
    }

    function reloadDefaultValues() {
      startWidth = panel.scrollWidth;
      appFrame = document.getElementById("app").getBoundingClientRect();
    }
    reloadDefaultValues();

    if($scope.alwaysVisible) {
      resizerColumn.classList.add("always-visible");
    }

    if($scope.hoverable) {
      resizerColumn.classList.add("hoverable");
    }

    $scope.setWidth = function(width, finish) {
      if(width < minWidth) {
        width = minWidth;
      }

      let parentRect = getParentRect();

      if(width > parentRect.width) {
        width = parentRect.width;
      }

      let maxWidth = appFrame.width - panel.getBoundingClientRect().x;
      if(width > maxWidth) {
        width = maxWidth;
      }

      if(width == parentRect.width) {
        panel.style.width = "100%";
        panel.style.flexBasis = "100%";
      } else {
        panel.style.flexBasis = width + "px";
        panel.style.width = width + "px";
      }

      lastWidth = width;

      if(finish) {
        $scope.finishSettingWidth();
      }
    }

    $scope.isCollapsed = function() {
      return lastWidth <= minWidth;
    }

    $scope.isAtMaxWidth = function() {
      return lastWidth == getParentRect().width;
    }

    $scope.setLeft = function(left) {
      panel.style.left = left + "px";
      lastLeft = left;
    }

    $scope.finishSettingWidth = function() {
      if(!$scope.collapsable) {
        return;
      }

      collapsed = $scope.isCollapsed();
      if(collapsed) {
        resizerColumn.classList.add("collapsed");
      } else {
        resizerColumn.classList.remove("collapsed");
      }
    }

    resizerColumn.addEventListener("mousedown", function(event){
      pressed = true;
      lastDownX = event.clientX;
      startWidth = panel.scrollWidth;
      startLeft = panel.offsetLeft;
      panel.classList.add("no-selection");

      if($scope.hoverable) {
        resizerColumn.classList.add("dragging");
      }
    })

    document.addEventListener("mousemove", function(event){
      if(!pressed) {
        return;
      }

      event.preventDefault();

      if($scope.property && $scope.property == 'left') {
        handleLeftEvent(event);
      } else {
        handleWidthEvent(event);
      }
    })

    function handleWidthEvent(event) {
      var rect = panel.getBoundingClientRect();
      var panelMaxX = rect.left + (startWidth || panel.style.maxWidth);

      var x;
      if(event) {
        x = event.clientX;
      } else {
        // coming from resize event
        x = 0;
        lastDownX = 0;
      }

      let deltaX = x - lastDownX;
      var newWidth = startWidth + deltaX;

      $scope.setWidth(newWidth, false);

      if($scope.onResize()) {
        $scope.onResize()(lastWidth, panel);
      }
    }

    function handleLeftEvent(event) {
      var panelRect = panel.getBoundingClientRect();
      var x = event.clientX || panelRect.x;
      let deltaX = x - lastDownX;
      var newLeft = startLeft + deltaX;
      if(newLeft < 0) {
        newLeft = 0;
        deltaX = -startLeft;
      }

      let parentRect = getParentRect();

      var newWidth = startWidth - deltaX;
      if(newWidth < minWidth) {
        newWidth = minWidth;
      }

      if(newWidth > parentRect.width) {
        newWidth = parentRect.width;
      }


      if(newLeft + newWidth > parentRect.width) {
        newLeft = parentRect.width - newWidth;
      }

      $scope.setLeft(newLeft, false);
      $scope.setWidth(newWidth, false);
    }

    document.addEventListener("mouseup", function(event){
      if(pressed) {
        pressed = false;
        resizerColumn.classList.remove("dragging");
        panel.classList.remove("no-selection");

        let isMaxWidth = $scope.isAtMaxWidth();

        if($scope.onResizeFinish) {
          $scope.onResizeFinish()(lastWidth, lastLeft, isMaxWidth);
        }

        $scope.finishSettingWidth();
      }
    })
  }

}

angular.module('app').directive('panelResizer', () => new PanelResizer);

/* via https://davidwalsh.name/javascript-debounce-function */
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};
