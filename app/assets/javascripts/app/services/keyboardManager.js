class KeyboardManager {

  constructor() {
    this.observers = [];

    KeyboardManager.KeyTab = "Tab";
    KeyboardManager.KeyBackspace = "Backspace";

    KeyboardManager.KeyModifierShift = "Shift";
    KeyboardManager.KeyModifierCtrl = "Control";
    // ⌘ key on Mac, ⊞ key on Windows
    KeyboardManager.KeyModifierMeta = "Meta";
    KeyboardManager.KeyModifierAlt = "Alt";

    KeyboardManager.KeyEventDown = "KeyEventDown";
    KeyboardManager.KeyEventUp = "KeyEventUp";

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  eventMatchesKeyAndModifiers(event, key, modifiers = [])  {

    for(let modifier of modifiers) {
      // For a modifier like ctrlKey, must check both event.ctrlKey and event.key.
      // That's because on keyup, event.ctrlKey would be false, but event.key == Control would be true.
      let matches = (
        ((event.ctrlKey || event.key == KeyboardManager.KeyModifierCtrl) && modifier === KeyboardManager.KeyModifierCtrl) ||
        ((event.metaKey || event.key == KeyboardManager.KeyModifierMeta) && modifier === KeyboardManager.KeyModifierMeta) ||
        ((event.altKey || event.key == KeyboardManager.KeyModifierAlt) && modifier === KeyboardManager.KeyModifierAlt) ||
        ((event.shiftKey || event.key == KeyboardManager.KeyModifierShift) && modifier === KeyboardManager.KeyModifierShift)
      )

      if(!matches) {
        return false;
      }
    }

    // Modifers match, check key
    if(!key) {
      return true;
    }


    return key == event.key;
  }

  notifyObserver(event, keyEventType) {
    for(let observer of this.observers) {
      if(observer.element && event.target != observer.element) {
        continue;
      }

      if(observer.notElement && observer.notElement == event.target) {
        continue;
      }

      if(observer.notElementIds && observer.notElementIds.includes(event.target.id)) {
        continue;
      }

      if(this.eventMatchesKeyAndModifiers(event, observer.key, observer.modifiers)) {
        let callback = keyEventType == KeyboardManager.KeyEventDown ? observer.onKeyDown : observer.onKeyUp;
        if(callback) {
          callback(event);
        }
      }
    }
  }

  handleKeyDown(event) {
    this.notifyObserver(event, KeyboardManager.KeyEventDown);
  }

  handleKeyUp(event) {
    this.notifyObserver(event, KeyboardManager.KeyEventUp);
  }

  addKeyObserver({key, modifiers, onKeyDown, onKeyUp, element, notElement, notElementIds}) {
    let observer = {key, modifiers, onKeyDown, onKeyUp, element, notElement, notElementIds};
    this.observers.push(observer);
    return observer;
  }

  removeKeyObserver(observer) {
    this.observers.splice(this.observers.indexOf(observer), 1);
  }
}

angular.module('app').service('keyboardManager', KeyboardManager);
