angular.module('app.frontend')
  .service('markdownRenderer', function ($sce) {

    marked.setOptions({
      breaks: true,
      sanitize: true,
      highlight: function (code) {
        return require('highlight.js').highlightAuto(code).value;
      }
    });

    this.renderedContentForText = function(text) {
      if(!text || text.length == 0) {
        return "";
      }
      return marked(text);
    }

    this.renderHtml = function(html_code) {
      return $sce.trustAsHtml(html_code);
    };


  });
