class KeyboardManager {

  constructor($timeout) {
    this.$timeout = $timeout;
    this.shortcutHandlers = [];
    this.contextHandlers = [];
    this.orderedContexts = ["tags", "notes", "editor"];

    this.registerShortcut(["left"], this.orderedContexts, false, () => {
      // go to previous context
      var previousIndex = this.orderedContexts.indexOf(this.context) - 1;
      if(previousIndex >= 0) {
        this.setContext(this.orderedContexts[previousIndex], 'keyboard');
      }
    })

    this.registerShortcut(["right"], this.orderedContexts, false, () => {
      // go to next context
      var nextIndex = this.orderedContexts.indexOf(this.context) + 1;
      if(nextIndex < this.orderedContexts.length) {
        this.setContext(this.orderedContexts[nextIndex], 'keyboard');
      }
    })
  }

  registerShortcut(combos, contexts, stopPropagation, callback) {

    if(!Array.isArray(contexts)) {
      contexts = [contexts];
    }

    if(!Array.isArray(combos)) {
      combos = [combos];
    }

    Mousetrap.bind(combos, (e, receivedCombo) => {
      this.handleKey(receivedCombo);
      return !stopPropagation;
    });

    let shortcutObject = {id: Math.random, combos: combos, contexts: contexts, callback: callback};
    this.shortcutHandlers.push(shortcutObject);
    return shortcutObject;
  }

  registerContextHandler(context, callback) {
    let contextObserver = {id: Math.random, context: context, callback: callback};
    this.contextHandlers.push(contextObserver);
    return contextObserver;
  }

  handleKey(combo) {
    for(let handler of this.shortcutHandlers) {
      if(handler.combos.includes(combo) && (handler.contexts.includes("*") || handler.contexts.includes(this.context))) {
        this.$timeout(() => {
          handler.callback(combo);
        })
      }
    }
  }

  setContext(context, source = 'click') {
    if(this.context == context) {
      return;
    }

    if(this.keyboardContextLocked && source == 'keyboard') {
      return;
    }

    // Notify of ending context
    if(this.context) {
      for(var observer of this.contextHandlers) {
        if(observer.context == this.context) {
          observer.callback(source, 'end');
        }
      }
    }

    this.context = context;

    // Notify of begining context
    for(var observer of this.contextHandlers) {
      if(observer.context == context) {
        observer.callback(source, 'begin');
      }
    }
  }

  lockKeyboardContext() {
    this.keyboardContextLocked = true;
  }

  unlockKeyboardContext() {
    this.keyboardContextLocked = false;
  }

}

angular.module('app.frontend').service('keyboardManager', KeyboardManager);
