class ThemeManager {

  constructor(modelManager, syncManager, $rootScope, storageManager, componentManager) {
    this.syncManager = syncManager;
    this.modelManager = modelManager;
    this.$rootScope = $rootScope;
    this.storageManager = storageManager;

    componentManager.registerHandler({identifier: "themeManager", areas: ["themes"], activationHandler: (component) => {
      if(component.active) {
        this.activateTheme(component);
      } else {
        this.deactivateTheme(component);
      }
    }});
  }

  get themes() {
    return this.modelManager.itemsForContentType("SN|Theme");
  }


  /*
    activeTheme: computed property that returns saved theme
    currentTheme: stored variable that allows other classes to watch changes
  */

  // get activeTheme() {
  //   var activeThemeId = this.storageManager.getItem("activeTheme");
  //   if(!activeThemeId) {
  //     return null;
  //   }
  //
  //   var theme = _.find(this.themes, {uuid: activeThemeId});
  //   return theme;
  // }

  activateInitialTheme() {
    // var theme = this.activeTheme;
    // if(theme) {
    //   this.activateTheme(theme);
    // }
  }

  // submitTheme(url) {
  //   var name = this.displayNameForThemeFile(this.fileNameFromPath(url));
  //   var theme = this.modelManager.createItem({content_type: "SN|Theme", url: url, name: name});
  //   this.modelManager.addItem(theme);
  //   theme.setDirty(true);
  //   this.syncManager.sync();
  // }

  activateTheme(theme) {
    if(this.activeTheme && this.activeTheme !== theme) {
      this.deactivateTheme(this.activeTheme);
    }


    var url = theme.computedUrl();

    var link = document.createElement("link");
    link.href = url;
    link.type = "text/css";
    link.rel = "stylesheet";
    link.media = "screen,print";
    link.id = theme.uuid;
    document.getElementsByTagName("head")[0].appendChild(link);
    this.storageManager.setItem("activeTheme", theme.uuid);

    this.currentTheme = theme;
    this.$rootScope.$broadcast("theme-changed");
  }

  deactivateTheme(theme) {
    this.storageManager.removeItem("activeTheme");
    var element = document.getElementById(theme.uuid);
    if(element) {
      element.disabled = true;
      element.parentNode.removeChild(element);
    }

    this.currentTheme = null;
    this.$rootScope.$broadcast("theme-changed");
  }

  fileNameFromPath(filePath) {
    return filePath.replace(/^.*[\\\/]/, '');
  }

  capitalizeString(string) {
    return string.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
  }

  displayNameForThemeFile(fileName) {
    let fromParam = getParameterByName("name", fileName);
    if(fromParam) {
      return fromParam;
    }
    let name = fileName.split(".")[0];
    let cleaned = name.split("-").join(" ");
    return this.capitalizeString(cleaned);
  }

}

angular.module('app.frontend').service('themeManager', ThemeManager);
