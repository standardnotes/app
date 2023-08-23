import FakeWebCrypto from './fake_web_crypto.js'

export async function safeDeinit(application) {
  if (application.dealloced) {
    console.warn(
      'Attempting to deinit already deinited application. Check the test case to find where you are double deiniting.',
    )
    return
  }

  await application.storage.awaitPersist()

  /** Limit waiting to 1s */
  await Promise.race([sleep(1, 'Deinit', true), application.sync?.awaitCurrentSyncs()])

  await application.prepareForDeinit()

  application.deinit(DeinitMode.Soft, DeinitSource.SignOut)
}

export async function sleep(seconds, reason, noLog = false) {
  if (!noLog) {
    console.warn(`Test sleeping for ${seconds}s. Reason: ${reason}`)
  }

  return new Promise((resolve) => {
    setTimeout(function () {
      resolve()
    }, seconds * 1000)
  })
}

export function generateUuid() {
  const crypto = new FakeWebCrypto()
  return crypto.generateUUID()
}

export async function awaitPromiseOrThrow(promise, maxWait, reason) {
  let timer = undefined

  // Create a promise that rejects in <maxWait> milliseconds
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      clearTimeout(timer)
      console.error(reason)
      reject(new Error(reason || `Promise timed out after ${maxWait} milliseconds: ${reason}`))
    }, maxWait * 1000)
  })

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]).then((result) => {
    clearTimeout(timer)
    return result
  })
}

export async function awaitPromiseOrDoNothing(promise, maxWait, reason) {
  let timer = undefined

  // Create a promise that resolves in <maxWait> milliseconds
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      clearTimeout(timer)
      const message = reason || `Promise timed out after ${maxWait} milliseconds: ${reason}`
      console.warn(message)
      resolve()
    }, maxWait * 1000)
  })

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]).then((result) => {
    clearTimeout(timer)
    return result
  })
}
