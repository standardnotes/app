class HttpManager {

  setBaseUrl(baseUrl) {
    this.baseUrl = baseUrl;
  }

  setAuthHeadersForRequest(request) {
    var token = localStorage.getItem("jwt");
    if(token) {
      request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem("jwt"));
    }
  }

  postAbsolute(url, params, onsuccess, onerror) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4) {
        console.log("on ready state", xmlhttp.readyState, "text:", xmlhttp.responseText);
        var response = xmlhttp.responseText;
        if(response) {
          response = JSON.parse(response);
        }

       if(xmlhttp.status == 200){
         console.log("onsuccess", response);
         onsuccess(response);
       } else {
         console.error("onerror", response);
         onerror(response)
       }
     }
    }

    xmlhttp.open("post", url, true);
    this.setAuthHeadersForRequest(xmlhttp);
    xmlhttp.setRequestHeader('Content-type', 'application/json');
    xmlhttp.send(JSON.stringify(params));
  }

  getAbsolute(url, params, onsuccess, onerror) {

    var formatParams = function(params) {
      return "?" + Object
            .keys(params)
            .map(function(key){
              return key+"="+params[key]
            })
            .join("&")
    }

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4) {
        var response = xmlhttp.responseText;
        if(response) {
          response = JSON.parse(response);
        }

       if(xmlhttp.status == 200){
         console.log("onsuccess", response);
         onsuccess(response);
       } else {
         console.error("onerror", response);
         onerror(response)
       }
     }
    }
    console.log("getting", url + formatParams(params));
    xmlhttp.open("get", url + formatParams(params), true);
    this.setAuthHeadersForRequest(xmlhttp);
    xmlhttp.setRequestHeader('Content-type', 'application/json');
    xmlhttp.send();
  }

}

angular.module('app.frontend').service('httpManager', HttpManager);
