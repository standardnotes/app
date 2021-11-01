import { WebDirective } from './../../types';
import { WebApplication } from '@/ui_models/application';
import { SNComponent, SNItem, ComponentArea } from '@standardnotes/snjs';
import { isDesktopApplication } from '@/utils';
import template from '%/directives/editor-menu.pug';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';

interface EditorMenuScope {
  callback: (component: SNComponent) => void;
  selectedEditorUuid: string;
  currentItem: SNItem;
  application: WebApplication;
}

class EditorMenuCtrl extends PureViewCtrl implements EditorMenuScope {
  callback!: () => (component: SNComponent) => void;
  selectedEditorUuid!: string;
  currentItem!: SNItem;
  application!: WebApplication;

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService) {
    super($timeout);
    this.state = {
      isDesktop: isDesktopApplication(),
    };
  }

  public isEditorSelected(editor: SNComponent) {
    if (!this.selectedEditorUuid) {
      return false;
    }
    return this.selectedEditorUuid === editor.uuid;
  }

  $onInit() {
    super.$onInit();
    const editors = this.application
      .componentManager!.componentsForArea(ComponentArea.Editor)
      .sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      });
    this.setState({
      editors: editors,
    });
  }

  selectComponent(component: SNComponent) {
    if (component) {
      if (component.conflictOf) {
        this.application.changeAndSaveItem(component.uuid, (mutator) => {
          mutator.conflictOf = undefined;
        });
      }
    }
    this.$timeout(() => {
      this.callback()(component);
    });
  }

  offlineAvailableForComponent(component: SNComponent) {
    return component.local_url && this.state.isDesktop;
  }
}

export class EditorMenu extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = EditorMenuCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      callback: '&',
      selectedEditorUuid: '=',
      currentItem: '=',
      application: '=',
    };
  }
}
