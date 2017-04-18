class BaseCtrl {
  constructor(syncManager, dbManager, authManager) {
    dbManager.openDatabase(null, function(){
      // new database, delete syncToken so that items can be refetched entirely from server
      syncManager.clearSyncToken();
      syncManager.sync();
    })

    // load analytics
    window._paq = window._paq || [];

    (function() {
      var u="https://piwik.standardnotes.org/";
      window._paq.push(['setTrackerUrl', u+'piwik.php']);
      window._paq.push(['setSiteId', '2']);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
    })();

    var analyticsId = authManager.getUserAnalyticsId();
    if(analyticsId) {
      window._paq.push(['setUserId', analyticsId]);
    }
    window._paq.push(['trackPageView']);
    window._paq.push(['enableLinkTracking']);
  }

}

angular.module('app.frontend').controller('BaseCtrl', BaseCtrl);
