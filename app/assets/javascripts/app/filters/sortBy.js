angular.module('app')
  .filter('sortBy', function ($filter) {
    return function(items, sortBy) {
      let sortValueFn = (a, b, pinCheck = false) => {
        if(!pinCheck) {
          if(a.pinned && b.pinned) {
            return sortValueFn(a, b, true);
          }
          if(a.pinned) { return -1; }
          if(b.pinned) { return 1; }
        }

        var aValue = a[sortBy] || "";
        var bValue = b[sortBy] || "";

        let vector = 1;
        if(sortBy == "title") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();

          if(aValue.length == 0 && bValue.length == 0) {
            return 0;
          } else if(aValue.length == 0 && bValue.length != 0) {
            return 1;
          } else if(aValue.length != 0 && bValue.length == 0) {
            return -1;
          } else  {
            vector = -1;
          }
        }

        if(aValue > bValue) { return -1 * vector;}
        else if(aValue < bValue) { return 1 * vector;}
        return 0;
      }

      items = items || [];
      var result = items.sort(function(a, b){
        return sortValueFn(a, b);
      })
      return result;
    };
  });
