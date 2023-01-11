/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * MIT License

Copyright (c) 2017 Jakub Chodorowicz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

export type Options<Result> = {
  isImmediate?: boolean
  maxWait?: number
  callback?: (data: Result) => void
}

export interface DebouncedFunction<Args extends any[], F extends (...args: Args) => any> {
  (this: ThisParameterType<F>, ...args: Args & Parameters<F>): Promise<ReturnType<F>>
  cancel: (reason?: any) => void
}

interface DebouncedPromise<FunctionReturn> {
  resolve: (result: FunctionReturn) => void
  reject: (reason?: any) => void
}

export function debounce<Args extends any[], F extends (...args: Args) => any>(
  func: F,
  waitMilliseconds = 50,
  options: Options<ReturnType<F>> = {},
): DebouncedFunction<Args, F> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const isImmediate = options.isImmediate ?? false
  const callback = options.callback ?? false
  const maxWait = options.maxWait
  let lastInvokeTime = Date.now()

  let promises: DebouncedPromise<ReturnType<F>>[] = []

  function nextInvokeTimeout() {
    if (maxWait !== undefined) {
      const timeSinceLastInvocation = Date.now() - lastInvokeTime

      if (timeSinceLastInvocation + waitMilliseconds >= maxWait) {
        return maxWait - timeSinceLastInvocation
      }
    }

    return waitMilliseconds
  }

  const debouncedFunction = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    // eslint-disable-next-line no-invalid-this, @typescript-eslint/no-this-alias
    const context = this
    return new Promise<ReturnType<F>>((resolve, reject) => {
      const invokeFunction = function () {
        timeoutId = undefined
        lastInvokeTime = Date.now()
        if (!isImmediate) {
          const result = func.apply(context, args)
          callback && callback(result)
          promises.forEach(({ resolve }) => resolve(result))
          promises = []
        }
      }

      const shouldCallNow = isImmediate && timeoutId === undefined

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(invokeFunction, nextInvokeTimeout())

      if (shouldCallNow) {
        const result = func.apply(context, args)
        callback && callback(result)
        return resolve(result)
      }
      promises.push({ resolve, reject })
    })
  }

  debouncedFunction.cancel = function (reason?: any) {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    promises.forEach(({ reject }) => reject(reason))
    promises = []
  }

  return debouncedFunction
}
