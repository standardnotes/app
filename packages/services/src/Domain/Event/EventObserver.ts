export type EventObserver<E, D> = (eventName: E, data?: D) => Promise<void> | void
