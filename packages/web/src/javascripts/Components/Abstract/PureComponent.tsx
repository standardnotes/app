import { ApplicationEvent } from '@standardnotes/snjs'
import { autorun, IReactionDisposer, IReactionPublic } from 'mobx'
import { Component } from 'react'
import { WebApplication } from '@/Application/WebApplication'

export type PureComponentState = Partial<Record<string, unknown>>
export type PureComponentProps = Partial<Record<string, unknown>>

export abstract class AbstractComponent<P = PureComponentProps, S = PureComponentState> extends Component<P, S> {
  private unsubApp!: () => void
  private reactionDisposers: IReactionDisposer[] = []

  constructor(
    props: P,
    public readonly application: WebApplication,
  ) {
    super(props)
  }

  override componentDidMount() {
    this.addAppEventObserver()
  }

  deinit(): void {
    this.unsubApp?.()

    for (const disposer of this.reactionDisposers) {
      disposer()
    }

    this.reactionDisposers.length = 0
    ;(this.unsubApp as unknown) = undefined
    ;(this.application as unknown) = undefined
    ;(this.props as unknown) = undefined
    ;(this.state as unknown) = undefined
  }

  override componentWillUnmount(): void {
    this.deinit()
  }

  autorun(view: (r: IReactionPublic) => void): void {
    this.reactionDisposers.push(autorun(view))
  }

  addAppEventObserver() {
    if (this.application.isStarted()) {
      this.onAppStart().catch(console.error)
    }

    if (this.application.isLaunched()) {
      this.onAppLaunch().catch(console.error)
    }

    this.unsubApp = this.application.addEventObserver(async (eventName, data: unknown) => {
      if (!this.application) {
        return
      }

      this.onAppEvent(eventName, data)

      if (eventName === ApplicationEvent.Started) {
        await this.onAppStart()
      } else if (eventName === ApplicationEvent.Launched) {
        await this.onAppLaunch()
      } else if (eventName === ApplicationEvent.CompletedIncrementalSync) {
        this.onAppIncrementalSync()
      } else if (eventName === ApplicationEvent.CompletedFullSync) {
        this.onAppFullSync()
      } else if (eventName === ApplicationEvent.KeyStatusChanged) {
        this.onAppKeyChange().catch(console.error)
      } else if (eventName === ApplicationEvent.LocalDataLoaded) {
        this.onLocalDataLoaded()
      }
    })
  }

  onAppEvent(_eventName: ApplicationEvent, _data?: unknown) {
    /** Optional override */
  }

  async onAppStart() {
    /** Optional override */
  }

  onLocalDataLoaded() {
    /** Optional override */
  }

  async onAppLaunch() {
    /** Optional override */
  }

  async onAppKeyChange() {
    /** Optional override */
  }

  onAppIncrementalSync() {
    /** Optional override */
  }

  onAppFullSync() {
    /** Optional override */
  }
}
