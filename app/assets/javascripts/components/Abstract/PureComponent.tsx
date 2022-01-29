import { ApplicationEvent } from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { autorun, IReactionDisposer, IReactionPublic } from 'mobx';
import { Component } from 'preact';
import { findDOMNode, unmountComponentAtNode } from 'preact/compat';

export type PureComponentState = Partial<Record<string, any>>;
export type PureComponentProps = Partial<Record<string, any>>;

export abstract class PureComponent<
  P = PureComponentProps,
  S = PureComponentState
> extends Component<P, S> {
  private unsubApp!: () => void;
  private unsubState!: () => void;
  private reactionDisposers: IReactionDisposer[] = [];

  constructor(props: P, protected application: WebApplication) {
    super(props);
  }

  componentDidMount() {
    this.addAppEventObserver();
    this.addAppStateObserver();
  }

  deinit(): void {
    this.unsubApp?.();
    this.unsubState?.();
    for (const disposer of this.reactionDisposers) {
      disposer();
    }
    this.reactionDisposers.length = 0;
    (this.unsubApp as unknown) = undefined;
    (this.unsubState as unknown) = undefined;
  }

  protected dismissModal(): void {
    const elem = this.getElement();
    if (!elem) {
      return;
    }

    const parent = elem.parentElement;
    if (!parent) {
      return;
    }
    parent.remove();
    unmountComponentAtNode(parent);
  }

  componentWillUnmount(): void {
    this.deinit();
  }

  render() {
    return <div>Must override</div>;
  }

  public get appState(): AppState {
    return this.application.getAppState();
  }

  protected getElement(): Element | null {
    return findDOMNode(this);
  }

  autorun(view: (r: IReactionPublic) => void): void {
    this.reactionDisposers.push(autorun(view));
  }

  addAppStateObserver() {
    this.unsubState = this.application!.getAppState().addObserver(
      async (eventName, data) => {
        this.onAppStateEvent(eventName, data);
      }
    );
  }

  onAppStateEvent(eventName: any, data: any) {
    /** Optional override */
  }

  addAppEventObserver() {
    if (this.application!.isStarted()) {
      this.onAppStart();
    }
    if (this.application!.isLaunched()) {
      this.onAppLaunch();
    }
    this.unsubApp = this.application!.addEventObserver(
      async (eventName, data: any) => {
        this.onAppEvent(eventName, data);
        if (eventName === ApplicationEvent.Started) {
          await this.onAppStart();
        } else if (eventName === ApplicationEvent.Launched) {
          await this.onAppLaunch();
        } else if (eventName === ApplicationEvent.CompletedIncrementalSync) {
          this.onAppIncrementalSync();
        } else if (eventName === ApplicationEvent.CompletedFullSync) {
          this.onAppFullSync();
        } else if (eventName === ApplicationEvent.KeyStatusChanged) {
          this.onAppKeyChange();
        } else if (eventName === ApplicationEvent.LocalDataLoaded) {
          this.onLocalDataLoaded();
        }
      }
    );
  }

  onAppEvent(eventName: ApplicationEvent, data?: any) {
    /** Optional override */
  }

  /** @override */
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
