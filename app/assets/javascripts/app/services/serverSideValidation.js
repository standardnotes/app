angular.module('app.frontend')
  .service('serverSideValidation', function ($sce) {
    // Show validation errors in form.
    this.showErrors = function (formErrors, form) {
      angular.forEach(formErrors, function (errors, key) {
        if (typeof form[key] !== 'undefined') {
          form[key].$setDirty();
          form[key].$setValidity('server', false);
          form[key].$error.server = $sce.trustAsHtml(errors.join(', '));
        }
      });
    };

    // Get validation errors from server response and show them in form.
    this.parseErrors = function (response, form) {
      if (response.status === 422) {
        this.showErrors(response.data, form);
      }
    };
});
