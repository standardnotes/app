import { WebDirective } from './../../types';
import { WebApplication } from '@/ui_models/application';
import { SNComponent, SNItem, ComponentArea } from 'snjs';
import { isDesktopApplication } from '@/utils';
import template from '%/directives/editor-menu.pug';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { ComponentMutator } from '@node_modules/snjs/dist/@types/models';

interface EditorMenuScope {
  callback: (component: SNComponent) => void
  selectedEditorUuid: string
  currentItem: SNItem
  application: WebApplication
}

class EditorMenuCtrl extends PureViewCtrl implements EditorMenuScope {

  callback!: () => (component: SNComponent) => void
  selectedEditorUuid!: string
  currentItem!: SNItem
  application!: WebApplication

  /* @ngInject */
  constructor(
    $timeout: ng.ITimeoutService,
  ) {
    super($timeout);
    this.state = {
      isDesktop: isDesktopApplication()
    };
  }

  public isEditorSelected(editor: SNComponent) {
    if(!this.selectedEditorUuid) {
      return false;
    }
    return this.selectedEditorUuid === editor.uuid;
  }

  public isEditorDefault(editor: SNComponent) {
    return this.state.defaultEditor?.uuid === editor.uuid;
  }

  $onInit() {
    super.$onInit();
    const editors = this.application.componentManager!.componentsForArea(ComponentArea.Editor)
      .sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      });
    const defaultEditor = editors.filter((e) => e.isDefaultEditor())[0];
    this.setState({
      editors: editors,
      defaultEditor: defaultEditor
    });
  };

  selectComponent(component: SNComponent) {
    if (component) {
      if (component.conflictOf) {
        this.application.changeAndSaveItem(component.uuid, (mutator) => {
          mutator.conflictOf = undefined;
        })
      }
    }
    this.$timeout(() => {
      this.callback()(component);
    });
  }

  toggleDefaultForEditor(editor: SNComponent) {
    if (this.state.defaultEditor === editor) {
      this.removeEditorDefault(editor);
    } else {
      this.makeEditorDefault(editor);
    }
  }

  offlineAvailableForComponent(component: SNComponent) {
    return component.local_url && this.state.isDesktop;
  }

  makeEditorDefault(component: SNComponent) {
    const currentDefault = this.application.componentManager!
      .componentsForArea(ComponentArea.Editor)
      .filter((e) => e.isDefaultEditor())[0];
    if (currentDefault) {
      this.application.changeItem(currentDefault.uuid, (m) => {
        const mutator = m as ComponentMutator;
        mutator.defaultEditor = false;
      })
    }
    this.application.changeAndSaveItem(component.uuid, (m) => {
      const mutator = m as ComponentMutator;
      mutator.defaultEditor = true;
    });
    this.setState({
      defaultEditor: component
    });
  }

  removeEditorDefault(component: SNComponent) {
    this.application.changeAndSaveItem(component.uuid, (m) => {
      const mutator = m as ComponentMutator;
      mutator.defaultEditor = false;
    });
    this.setState({
      defaultEditor: null
    });
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
      application: '='
    };
  }
}
