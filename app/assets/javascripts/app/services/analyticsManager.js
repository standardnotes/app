class AnalyticsManager {

  constructor(authManager) {
    this.authManager = authManager;

    var status = localStorage.getItem("analyticsEnabled");
    if(status === null) {
      this.enabled = true;
    } else {
      this.enabled = JSON.parse(status);
    }

    if(this.enabled === true) {
      this.initialize();
    }
  }

  setStatus(enabled) {
    this.enabled = enabled;
    localStorage.setItem("analyticsEnabled", JSON.stringify(enabled));

    window.location.reload();
  }

  toggleStatus() {
    this.setStatus(!this.enabled);
  }

  initialize() {
    // load analytics
    window._paq = window._paq || [];

    (function() {
      var u="https://piwik.standardnotes.org/";
      window._paq.push(['setTrackerUrl', u+'piwik.php']);
      window._paq.push(['setSiteId', '2']);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.type='text/javascript'; g.id="piwik", g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
    })();

    var analyticsId = this.authManager.getUserAnalyticsId();
    if(analyticsId) {
      window._paq.push(['setUserId', analyticsId]);
    }
    window._paq.push(['trackPageView', "AppInterface"]);
    window._paq.push(['enableLinkTracking']);
  }

}

angular.module('app.frontend').service('analyticsManager', AnalyticsManager);
