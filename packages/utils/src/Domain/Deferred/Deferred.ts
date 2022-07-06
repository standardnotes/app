export const Deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: () => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    resolve,
    reject,
    promise,
  }
}
