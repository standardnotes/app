angular
  .module('app.frontend')
  .directive('draggable', function() {
  return  {
    scope: {
      note: "="
    },
    link: function(scope, element) {
      // this gives us the native JS object
      var el = element[0];

      el.draggable = true;

      el.addEventListener(
        'dragstart',
        function(e) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('Note', JSON.stringify(scope.note));
          this.classList.add('drag');
          return false;
        },
        false
      );

      el.addEventListener(
        'dragend',
        function(e) {
          this.classList.remove('drag');
          return false;
        },
        false
      );
    }
  }
});

angular
  .module('app.frontend')
  .directive('droppable', function() {
  return {
    scope: {
      drop: '&',
      bin: '=',
      tag: "="
    },
    link: function(scope, element) {
      // again we need the native object
      var el = element[0];

      el.addEventListener(
        'dragover',
        function(e) {
          e.dataTransfer.dropEffect = 'move';
          // allows us to drop
          if (e.preventDefault) e.preventDefault();
          this.classList.add('over');
          return false;
        },
        false
      );

      var counter = 0;

      el.addEventListener(
        'dragenter',
        function(e) {
          counter++;
          this.classList.add('over');
          return false;
        },
        false
      );

      el.addEventListener(
        'dragleave',
        function(e) {
          counter--;
           if (counter === 0) {
             this.classList.remove('over');
           }
          return false;
        },
        false
      );

      el.addEventListener(
        'drop',
        function(e) {
          // Stops some browsers from redirecting.
          if (e.stopPropagation) e.stopPropagation();

          this.classList.remove('over');

          var binId = this.uuid;
          var note = new Note(JSON.parse(e.dataTransfer.getData('Note')));
          scope.$apply(function(scope) {
            var fn = scope.drop();
            if ('undefined' !== typeof fn) {
              fn(e, scope.tag, note);
            }
          });

          return false;
        },
        false
      );
    }
  }
});
