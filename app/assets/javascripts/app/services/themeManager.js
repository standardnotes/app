class ThemeManager {

  constructor(componentManager, desktopManager, storageManager) {
    this.componentManager = componentManager;
    this.storageManager = storageManager;
    this.desktopManager = desktopManager;
    this.activeThemes = [];

    ThemeManager.CachedThemesKey = "cachedThemes";

    this.registerObservers();
    this.activateCachedThemes();
  }

  activateCachedThemes() {
    let cachedThemes = this.getCachedThemes();
    let writeToCache = false;
    for(var theme of cachedThemes) {
      this.activateTheme(theme, writeToCache);
    }
  }

  registerObservers() {
    this.desktopManager.registerUpdateObserver((component) => {
      // Reload theme if active
      if(component.active && component.isTheme()) {
        this.deactivateTheme(component);
        setTimeout(() => {
          this.activateTheme(component);
        }, 10);
      }
    })

    this.componentManager.registerHandler({identifier: "themeManager", areas: ["themes"], activationHandler: (component) => {
      if(component.active) {
        this.activateTheme(component);
      } else {
        this.deactivateTheme(component);
      }
    }});
  }

  hasActiveTheme() {
    return this.componentManager.getActiveThemes().length > 0;
  }

  deactivateAllThemes() {
    var activeThemes = this.componentManager.getActiveThemes();
    for(var theme of activeThemes) {
      if(theme) {
        this.componentManager.deactivateComponent(theme);
      }
    }

    this.decacheThemes();
  }

  activateTheme(theme, writeToCache = true) {
    if(_.find(this.activeThemes, {uuid: theme.uuid})) {
      return;
    }

    console.log("Activating theme", theme.uuid);

    this.activeThemes.push(theme);

    var url = this.componentManager.urlForComponent(theme);
    var link = document.createElement("link");
    link.href = url;
    link.type = "text/css";
    link.rel = "stylesheet";
    link.media = "screen,print";
    link.id = theme.uuid;
    document.getElementsByTagName("head")[0].appendChild(link);

    if(writeToCache) {
      this.cacheThemes();
    }
  }

  deactivateTheme(theme) {
    var element = document.getElementById(theme.uuid);
    if(element) {
      element.disabled = true;
      element.parentNode.removeChild(element);
    }

    _.remove(this.activeThemes, {uuid: theme.uuid});

    this.cacheThemes();
  }

  async cacheThemes() {
    let mapped = await Promise.all(this.activeThemes.map(async (theme) => {
      let transformer = new SFItemParams(theme);
      let params = await transformer.paramsForLocalStorage();
      return params;
    }));
    let data = JSON.stringify(mapped);
    console.log("Caching themes", data);
    return this.storageManager.setItem(ThemeManager.CachedThemesKey, data, StorageManager.Fixed);
  }

  async decacheThemes() {
    return this.storageManager.removeItem(ThemeManager.CachedThemesKey, StorageManager.Fixed);
  }

  getCachedThemes() {
    let cachedThemes = this.storageManager.getItemSync(ThemeManager.CachedThemesKey, StorageManager.Fixed);
    if(cachedThemes) {
      let parsed = JSON.parse(cachedThemes);
      return parsed.map((theme) => {
        return new SNTheme(theme);
      });
    } else {
      return [];
    }
  }
}

angular.module('app').service('themeManager', ThemeManager);
