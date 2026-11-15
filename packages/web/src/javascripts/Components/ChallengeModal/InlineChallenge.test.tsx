import { Challenge, ChallengeReason } from '@standardnotes/snjs'
import { MutableRefObject } from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot, Root } from 'react-dom/client'
import { InlineChallengeHandler, InlineChallengeHandlerContext, useInlineChallenge } from './InlineChallenge'

const application = { cancelChallenge: jest.fn() }

jest.mock('../ApplicationProvider', () => ({
  useApplication: () => application,
}))

const challenge = (reason: ChallengeReason) => ({ id: String(reason), reason }) as unknown as Challenge

describe('useInlineChallenge', () => {
  let container: HTMLDivElement
  let root: Root
  let offerChallenge: MutableRefObject<InlineChallengeHandler | undefined>
  let shown: ReturnType<typeof useInlineChallenge> | undefined

  const Host = ({ authorize }: { authorize: () => Promise<unknown> }) => {
    shown = useInlineChallenge(ChallengeReason.AccessProtectedNote, authorize)
    return null
  }

  const render = (authorize: () => Promise<unknown>) => {
    act(() => {
      root.render(
        <InlineChallengeHandlerContext.Provider value={offerChallenge}>
          <Host authorize={authorize} />
        </InlineChallengeHandlerContext.Provider>,
      )
    })
  }

  beforeAll(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  beforeEach(() => {
    application.cancelChallenge = jest.fn()
    container = document.createElement('div')
    root = createRoot(container)
    offerChallenge = { current: undefined }
    shown = undefined
  })

  afterEach(() => {
    act(() => root.unmount())
  })

  it('takes over the challenge raised by authorize', () => {
    const note = challenge(ChallengeReason.AccessProtectedNote)
    let accepted: boolean | undefined
    render(() => {
      accepted = offerChallenge.current?.(note)
      return new Promise(() => undefined)
    })

    expect(accepted).toBe(true)
    expect(shown?.challenge).toBe(note)
  })

  it('leaves challenges with other reasons to the modal', () => {
    let accepted: boolean | undefined
    render(() => {
      accepted = offerChallenge.current?.(challenge(ChallengeReason.ExportBackup))
      return new Promise(() => undefined)
    })

    expect(accepted).toBe(false)
    expect(shown?.challenge).toBeUndefined()
  })

  it('stops taking challenges once authorization has finished', async () => {
    await act(async () => render(() => Promise.resolve(true)))

    expect(offerChallenge.current).toBeUndefined()
  })

  it('cancels a pending challenge when unmounted, but not a dismissed one', () => {
    const note = challenge(ChallengeReason.AccessProtectedNote)
    render(() => {
      offerChallenge.current?.(note)
      return new Promise(() => undefined)
    })

    act(() => root.unmount())
    expect(application.cancelChallenge).toHaveBeenCalledWith(note)

    root = createRoot(container)
    application.cancelChallenge = jest.fn()
    render(() => {
      offerChallenge.current?.(note)
      return new Promise(() => undefined)
    })
    act(() => shown?.onDismiss())
    act(() => root.unmount())
    expect(application.cancelChallenge).not.toHaveBeenCalled()
    root = createRoot(container)
  })

  it('starts authorization again on retry', () => {
    const authorize = jest.fn(() => new Promise(() => undefined))
    render(authorize)
    act(() => shown?.retry())

    expect(authorize).toHaveBeenCalledTimes(2)
  })
})
