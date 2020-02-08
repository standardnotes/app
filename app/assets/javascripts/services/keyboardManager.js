/** @public */
export const KeyboardKeys = {
  Tab: "Tab",
  Backspace: "Backspace",
  Up: "ArrowUp",
  Down: "ArrowDown",
};
/** @public */
export const KeyboardModifiers = {
  Shift: "Shift",
  Ctrl: "Control",
  /** ⌘ key on Mac, ⊞ key on Windows */
  Meta: "Meta",
  Alt: "Alt",
};
/** @private */
const KeyboardKeyEvents = {
  Down: "KeyEventDown",
  Up: "KeyEventUp"
};

export class KeyboardManager {
  constructor() {
    this.observers = [];
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  modifiersForEvent(event) {
    const allModifiers = Object.keys(KeyboardModifiers).map((key) => KeyboardModifiers[key]);
    const eventModifiers = allModifiers.filter((modifier) => {
      // For a modifier like ctrlKey, must check both event.ctrlKey and event.key.
      // That's because on keyup, event.ctrlKey would be false, but event.key == Control would be true.
      const matches = (
        ((event.ctrlKey || event.key === KeyboardModifiers.Ctrl) && modifier === KeyboardModifiers.Ctrl) ||
        ((event.metaKey || event.key === KeyboardModifiers.Meta) && modifier === KeyboardModifiers.Meta) ||
        ((event.altKey || event.key === KeyboardModifiers.Alt) && modifier === KeyboardModifiers.Alt) ||
        ((event.shiftKey || event.key === KeyboardModifiers.Shift) && modifier === KeyboardModifiers.Shift)
      );

      return matches;
    });

    return eventModifiers;
  }

  eventMatchesKeyAndModifiers(event, key, modifiers = []) {
    const eventModifiers = this.modifiersForEvent(event);

    if (eventModifiers.length !== modifiers.length) {
      return false;
    }

    for (const modifier of modifiers) {
      if (!eventModifiers.includes(modifier)) {
        return false;
      }
    }

    // Modifers match, check key
    if (!key) {
      return true;
    }

    // In the browser, shift + f results in key 'f', but in Electron, shift + f results in 'F'
    // In our case we don't differentiate between the two.
    return key.toLowerCase() === event.key.toLowerCase();
  }

  notifyObserver(event, keyEventType) {
    for (const observer of this.observers) {
      if (observer.element && event.target !== observer.element) {
        continue;
      }

      if (observer.elements && !observer.elements.includes(event.target)) {
        continue;
      }

      if (observer.notElement && observer.notElement === event.target) {
        continue;
      }

      if (observer.notElementIds && observer.notElementIds.includes(event.target.id)) {
        continue;
      }

      if (this.eventMatchesKeyAndModifiers(event, observer.key, observer.modifiers)) {
        const callback = keyEventType === KeyboardKeyEvents.Down ? observer.onKeyDown : observer.onKeyUp;
        if (callback) {
          callback(event);
        }
      }
    }
  }

  handleKeyDown(event) {
    this.notifyObserver(event, KeyboardKeyEvents.Down);
  }

  handleKeyUp(event) {
    this.notifyObserver(event, KeyboardKeyEvents.Up);
  }

  addKeyObserver({ key, modifiers, onKeyDown, onKeyUp, element, elements, notElement, notElementIds }) {
    const observer = { key, modifiers, onKeyDown, onKeyUp, element, elements, notElement, notElementIds };
    this.observers.push(observer);
    return observer;
  }

  removeKeyObserver(observer) {
    this.observers.splice(this.observers.indexOf(observer), 1);
  }
}
