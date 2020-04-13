/* @ngInject */
export function lowercase() {
  return {
    require: 'ngModel',
    link: function (
      scope: ng.IScope,
      _: JQLite,
      attrs: any,
      ctrl: ng.IController
    ) {
      const lowercase = (inputValue: string) => {
        if (inputValue === undefined) inputValue = '';
        const lowercased = inputValue.toLowerCase();
        if (lowercased !== inputValue) {
          ctrl.$setViewValue(lowercased);
          ctrl.$render();
        }
        return lowercased;
      };
      ctrl.$parsers.push(lowercase);
      lowercase((scope as any)[attrs.ngModel]);
    }
  };
}
