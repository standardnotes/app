import { PanelPuppet, WebDirective } from '@/types';
import { WebApplication } from '@/ui_models/application';
import { AppStateEvent } from '@/ui_models/app_state';
import { PANEL_NAME_TAGS } from '@/views/constants';
import {
  ApplicationEvent,
  ComponentAction,
  ComponentArea,
  ContentType, MessageData, PrefKey,
  SNComponent,
  SNSmartTag,
  SNTag,
  UuidString
} from '@standardnotes/snjs';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import template from './tags-view.pug';

type NoteCounts = Partial<Record<string, number>>;

type TagState = {
  smartTags: SNSmartTag[];
  noteCounts: NoteCounts;
  selectedTag?: SNTag;
  componentViewer?: ComponentViewer;
};

class TagsViewCtrl extends PureViewCtrl<unknown, TagState> {
  /** Passed through template */
  readonly application!: WebApplication;
  private readonly panelPuppet: PanelPuppet;
  private unregisterComponent?: () => void;
  /** The original name of the edtingTag before it began editing */
  formData: { tagTitle?: string } = {};
  titles: Partial<Record<UuidString, string>> = {};
  private removeTagsObserver!: () => void;
  private removeFoldersObserver!: () => void;

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService) {
    super($timeout);
    this.panelPuppet = {
      onReady: () => this.loadPreferences(),
    };
  }

  deinit() {
    this.removeTagsObserver?.();
    (this.removeTagsObserver as unknown) = undefined;
    (this.removeFoldersObserver as unknown) = undefined;
    this.unregisterComponent?.();
    this.unregisterComponent = undefined;
    super.deinit();
  }

  getInitialState(): TagState {
    return {
      smartTags: [],
      noteCounts: {},
    };
  }

  getState(): TagState {
    return this.state;
  }

  async onAppLaunch() {
    super.onAppLaunch();
    this.loadPreferences();
    this.streamForFoldersComponent();

    const smartTags = this.application.getSmartTags();
    this.setState({ smartTags });
    this.selectTag(smartTags[0]);
  }

  /** @override */
  onAppIncrementalSync() {
    super.onAppIncrementalSync();
    this.reloadNoteCounts();
  }

  async setFoldersComponent(component?: SNComponent) {
    if (this.state.componentViewer) {
      this.application.componentManager.destroyComponentViewer(
        this.state.componentViewer
      );
      await this.setState({ componentViewer: undefined });
    }
    if (component) {
      await this.setState({
        componentViewer:
          this.application.componentManager.createComponentViewer(
            component,
            undefined,
            this.handleFoldersComponentMessage.bind(this)
          ),
      });
    }
  }

  handleFoldersComponentMessage(
    action: ComponentAction,
    data: MessageData
  ): void {
    if (action === ComponentAction.SelectItem) {
      const item = data.item;
      if (!item) {
        return;
      }

      if (item.content_type === ContentType.Tag) {
        const matchingTag = this.application.findItem(item.uuid);

        if (matchingTag) {
          this.selectTag(matchingTag as SNTag);
        }
      } else if (item.content_type === ContentType.SmartTag) {
        const matchingTag = this.getState().smartTags.find(
          (t) => t.uuid === item.uuid
        );

        if (matchingTag) {
          this.selectTag(matchingTag);
        }
      }
    } else if (action === ComponentAction.ClearSelection) {
      this.selectTag(this.getState().smartTags[0]);
    }
  }

  streamForFoldersComponent() {
    this.removeFoldersObserver = this.application.streamItems(
      [ContentType.Component],
      async () => {
        this.component = this.application.componentManager
          .componentsForArea(ComponentArea.TagsList)
          .find((component) => component.active);
      }
    );
  }

  /** @override */
  onAppStateEvent(eventName: AppStateEvent) {
    if (eventName === AppStateEvent.TagChanged) {
      this.setState({
        selectedTag: this.application.getAppState().getSelectedTag(),
      });
    }
  }

  /** @override */
  async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName);
    switch (eventName) {
      case ApplicationEvent.LocalDataIncrementalLoad:
        this.reloadNoteCounts();
        break;
      case ApplicationEvent.PreferencesChanged:
        this.loadPreferences();
        break;
    }
  }

  reloadNoteCounts() {
    const smartTags = this.state.smartTags;
    const noteCounts: NoteCounts = {};

    for (const tag of smartTags) {
      /** Other smart tags do not contain counts */
      if (tag.isAllTag) {
        const notes = this.application
          .notesMatchingSmartTag(tag as SNSmartTag)
          .filter((note) => {
            return !note.archived && !note.trashed;
          });
        noteCounts[tag.uuid] = notes.length;
      }
    }

    this.setState({
      noteCounts: noteCounts,
    });
  }

  loadPreferences() {
    if (!this.panelPuppet.ready) {
      return;
    }

    const width = this.application.getPreference(PrefKey.TagsPanelWidth);
    if (width) {
      this.panelPuppet.setWidth!(width);
      if (this.panelPuppet.isCollapsed!()) {
        this.application
          .getAppState()
          .panelDidResize(PANEL_NAME_TAGS, this.panelPuppet.isCollapsed!());
      }
    }
  }

  onPanelResize = (
    newWidth: number,
    _lastLeft: number,
    _isAtMaxWidth: boolean,
    isCollapsed: boolean
  ) => {
    this.application
      .setPreference(PrefKey.TagsPanelWidth, newWidth)
      .then(() => this.application.sync());
    this.application.getAppState().panelDidResize(PANEL_NAME_TAGS, isCollapsed);
  };

  registerComponentHandler() {
    this.unregisterComponent =
      this.application.componentManager.registerHandler({
        identifier: 'tags',
        areas: [ComponentArea.TagsList],
        actionHandler: (_, action, data) => {
          // TODO: move this to tags state.
          if (action === ComponentAction.SelectItem) {
            const item = data.item;

            if (!item) {
              return;
            }

            if (item.content_type === ContentType.Tag) {
              const matchingTag = this.application.findItem(item.uuid);

              if (matchingTag) {
                this.selectTag(matchingTag as SNTag);
              }
            } else if (item.content_type === ContentType.SmartTag) {
              const matchingTag = this.getState().smartTags.find(
                (t) => t.uuid === item.uuid
              );

              if (matchingTag) {
                this.selectTag(matchingTag);
              }
            }
          } else if (action === ComponentAction.ClearSelection) {
            this.selectTag(this.getState().smartTags[0]);
          }
        },
      });
  }
}

export class TagsView extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.scope = {
      application: '=',
    };
    this.template = template;
    this.replace = true;
    this.controller = TagsViewCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
