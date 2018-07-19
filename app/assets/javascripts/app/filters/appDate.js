// reuse
var locale, formatter;

angular.module('app')
  .filter('appDate', function ($filter) {
      return function (input) {
          return input ? $filter('date')(new Date(input), 'MM/dd/yyyy', 'UTC') : '';
      };
  })
  .filter('appDateTime', function ($filter) {
      return function (input) {
        if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
          if (!formatter) {
            locale = (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language;
            formatter = new Intl.DateTimeFormat(locale, {
              year: 'numeric',
              month: 'numeric',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
          }
          return formatter.format(input);
        } else {
          return input ? $filter('date')(new Date(input), 'MM/dd/yyyy h:mm a') : '';
        }
      }
  });
