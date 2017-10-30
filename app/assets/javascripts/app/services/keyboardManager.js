class KeyboardManager {

  constructor($timeout) {
    this.$timeout = $timeout;
    this.actions = [];
    this.contextHandlers = [];
    this.orderedContexts = ["tags", "notes", "editor"];

    this.registerAction("previous-context", () => {
      var previousIndex = this.orderedContexts.indexOf(this.context) - 1;
      if(previousIndex >= 0) {
        this.setContext(this.orderedContexts[previousIndex], 'keyboard');
      }
    })

    this.registerAction("next-context", () => {
      var nextIndex = this.orderedContexts.indexOf(this.context) + 1;
      if(nextIndex < this.orderedContexts.length) {
        this.setContext(this.orderedContexts[nextIndex], 'keyboard');
      }
    })

    this.registerDefaultShortcuts();
  }

  registerDefaultShortcuts() {
    for(var mapping of this.defaultMappings()) {
      Mousetrap.bind(mapping.shortcut, (e, command) => {
        this.handleKeyboardCommand(command);
        return !mapping.preventDefault;
      });
    }
  }

  handleKeyboardCommand(shortcut) {
    for(var mapping of this.defaultMappings()) {
      let validShortcuts = Array.isArray(mapping.shortcut) ? mapping.shortcut : [mapping.shortcut];
      let validContexts = Array.isArray(mapping.context) ? mapping.context : [mapping.context];
      let isCorrectContext = validContexts.includes("*") || validContexts.includes(this.context)

      if(validShortcuts.includes(shortcut) && isCorrectContext) {
        let action = this.actionForName(mapping.action);
        this.$timeout(() => {
          action.callback();
        })
      }
    }
  }

  registerContextHandler(context, callback) {
    let contextObserver = {id: Math.random, context: context, callback: callback};
    this.contextHandlers.push(contextObserver);
    return contextObserver;
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

  registerAction(action, callback) {
    this.actions.push({
      name: action,
      callback: callback
    })
  }

  actionForName(actionName) {
    return _.find(this.actions, {name: actionName});
  }

  defaultMappings() {
    return [

      // internal
      {
        action: "next-context",
        context: ["tags", "notes", "editor"],
        shortcut: "right",
      },
      {
        action: "previous-context",
        context: ["tags", "notes", "editor"],
        shortcut: "left",
      },

      // notes
      {
        action: "create-new-note",
        context: "*",
        shortcut: ["command+n", "command+k", "command+shift+n"]
      },
      {
        action: "next-note",
        context: "notes",
        shortcut: "down",
        preventDefault: true
      },
      {
        action: "previous-note",
        context: "notes",
        shortcut: "up",
        preventDefault: true
      },

      // tags
      {
        action: "create-new-tag",
        context: "*",
        shortcut: ["command+t", "command+shift+t"]
      },
      {
        action: "next-tag",
        context: "tags",
        shortcut: "down",
        preventDefault: true
      },
      {
        action: "previous-tag",
        context: "tags",
        shortcut: "up",
        preventDefault: true
      },

      // editor
      {
        action: "delete-current-note",
        context: ["notes", "editor"],
        shortcut: ["command+d", "command+shift+d"],
        preventDefault: true
      },
      {
        action: "toggle-note-archived",
        context: ["notes", "editor"],
        shortcut: "command+shift+a",
      },
      {
        action: "toggle-note-pinned",
        context: ["notes", "editor"],
        shortcut: "command+shift+p",
      },
    ]
  }

}

angular.module('app.frontend').service('keyboardManager', KeyboardManager);
