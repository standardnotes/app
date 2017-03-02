class HttpManager {

  constructor($timeout) {
    // calling callbacks in a $timeout allows angular UI to update
    this.$timeout = $timeout;
  }

  setAuthHeadersForRequest(request) {
    var token = localStorage.getItem("jwt");
    if(token) {
      request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem("jwt"));
    }
  }

  postAbsolute(url, params, onsuccess, onerror) {
    this.httpRequest("post", url, params, onsuccess, onerror);
  }

  getAbsolute(url, params, onsuccess, onerror) {
    this.httpRequest("get", url, params, onsuccess, onerror);
  }

  httpRequest(verb, url, params, onsuccess, onerror) {

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4) {
        var response = xmlhttp.responseText;
        if(response) {
          response = JSON.parse(response);
        }

       if(xmlhttp.status >= 200 && xmlhttp.status <= 299){
         this.$timeout(function(){
           onsuccess(response);
         })
       } else {
         console.error("Request error:", response);
         this.$timeout(function(){
           onerror(response)
         })
       }
     }
   }.bind(this)

    if(verb == "get" && Object.keys(params).length > 0) {
      url = url + this.formatParams(params);
    }

    xmlhttp.open(verb, url, true);
    this.setAuthHeadersForRequest(xmlhttp);
    xmlhttp.setRequestHeader('Content-type', 'application/json');

    if(verb == "post") {
      xmlhttp.send(JSON.stringify(params));
    } else {
      xmlhttp.send();
    }
  }

  formatParams(params) {
    return "?" + Object
          .keys(params)
          .map(function(key){
            return key+"="+params[key]
          })
          .join("&")
  }

}

angular.module('app.frontend').service('httpManager', HttpManager);
