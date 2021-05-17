import { removeFromArray } from '@standardnotes/snjs';
export enum KeyboardKey {
  Tab = 'Tab',
  Backspace = 'Backspace',
  Up = 'ArrowUp',
  Down = 'ArrowDown',
}

export enum KeyboardModifier {
  Shift = 'Shift',
  Ctrl = 'Control',
  /** ⌘ key on Mac, ⊞ key on Windows */
  Meta = 'Meta',
  Alt = 'Alt',
}

enum KeyboardKeyEvent {
  Down = 'KeyEventDown',
  Up = 'KeyEventUp',
}

type KeyboardObserver = {
  key?: KeyboardKey | string;
  modifiers?: KeyboardModifier[];
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  element?: HTMLElement;
  elements?: HTMLElement[];
  notElement?: HTMLElement;
  notElementIds?: string[];
};

export class IOService {
  readonly activeModifiers = new Set<KeyboardModifier>();
  private observers: KeyboardObserver[] = [];

  constructor(private isMac: boolean) {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  public deinit() {
    this.observers.length = 0;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    (this.handleKeyDown as unknown) = undefined;
    (this.handleKeyUp as unknown) = undefined;
    (this.handleWindowBlur as unknown) = undefined;
  }

  handleKeyDown = (event: KeyboardEvent): void => {
    for (const modifier of this.modifiersForEvent(event)) {
      switch (modifier) {
        case KeyboardModifier.Meta: {
          if (this.isMac) {
            this.activeModifiers.add(modifier);
          }
          break;
        }
        case KeyboardModifier.Ctrl: {
          if (!this.isMac) {
            this.activeModifiers.add(modifier);
          }
          break;
        }
        default: {
          this.activeModifiers.add(modifier);
          break;
        }
      }
    }
    this.notifyObserver(event, KeyboardKeyEvent.Down);
  };

  handleKeyUp = (event: KeyboardEvent): void => {
    for (const modifier of this.modifiersForEvent(event)) {
      this.activeModifiers.delete(modifier);
    }
    this.notifyObserver(event, KeyboardKeyEvent.Up);
  };

  handleWindowBlur = (): void => {
    for (const modifier of this.activeModifiers) {
      this.activeModifiers.delete(modifier);
    }
  };

  modifiersForEvent(event: KeyboardEvent): KeyboardModifier[] {
    const allModifiers = Object.values(KeyboardModifier);
    const eventModifiers = allModifiers.filter((modifier) => {
      // For a modifier like ctrlKey, must check both event.ctrlKey and event.key.
      // That's because on keyup, event.ctrlKey would be false, but event.key == Control would be true.
      const matches =
        ((event.ctrlKey || event.key === KeyboardModifier.Ctrl) &&
          modifier === KeyboardModifier.Ctrl) ||
        ((event.metaKey || event.key === KeyboardModifier.Meta) &&
          modifier === KeyboardModifier.Meta) ||
        ((event.altKey || event.key === KeyboardModifier.Alt) &&
          modifier === KeyboardModifier.Alt) ||
        ((event.shiftKey || event.key === KeyboardModifier.Shift) &&
          modifier === KeyboardModifier.Shift);

      return matches;
    });

    return eventModifiers;
  }

  eventMatchesKeyAndModifiers(
    event: KeyboardEvent,
    key: KeyboardKey | string,
    modifiers: KeyboardModifier[] = []
  ): boolean {
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

  notifyObserver(event: KeyboardEvent, keyEvent: KeyboardKeyEvent): void {
    const target = event.target as HTMLElement;
    for (const observer of this.observers) {
      if (observer.element && event.target !== observer.element) {
        continue;
      }

      if (observer.elements && !observer.elements.includes(target)) {
        continue;
      }

      if (observer.notElement && observer.notElement === event.target) {
        continue;
      }

      if (
        observer.notElementIds &&
        observer.notElementIds.includes(target.id)
      ) {
        continue;
      }

      if (
        this.eventMatchesKeyAndModifiers(
          event,
          observer.key!,
          observer.modifiers
        )
      ) {
        const callback =
          keyEvent === KeyboardKeyEvent.Down
            ? observer.onKeyDown
            : observer.onKeyUp;
        if (callback) {
          callback(event);
        }
      }
    }
  }

  addKeyObserver(observer: KeyboardObserver): () => void {
    this.observers.push(observer);
    return () => {
      removeFromArray(this.observers, observer);
    };
  }
}
