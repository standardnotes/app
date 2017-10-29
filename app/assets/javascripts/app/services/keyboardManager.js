class KeyboardManager {

  constructor() {
    this.shortcutHandlers = [];
  }

  registerShortcut(combo, context, stopPropagation, callback) {

    Mousetrap.bind(combo, (e, receivedCombo) => {
      this.handleKey(receivedCombo);
      return !stopPropagation;
    });

    let shortcutObject = {id: Math.rand, combo: combo, context: context, callback: callback};
    this.shortcutHandlers.push(shortcutObject);
    return shortcutObject;
  }

  handleKey(combo) {
    for(var handler of this.shortcutHandlers) {
      if(handler.combo == combo && (!handler.context || handler.context == this.context)) {
        handler.callback();
      }
    }
  }

  setContext(context) {
    this.context = context;
  }

}

angular.module('app.frontend').service('keyboardManager', KeyboardManager);
