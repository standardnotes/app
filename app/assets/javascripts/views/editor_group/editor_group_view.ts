import { WebApplication } from '@/ui_models/application';
import { WebDirective } from './../../types';
import template from './editor-group-view.pug';
import { Editor } from '@/ui_models/editor';
import { PureViewCtrl } from '../abstract/pure_view_ctrl';

class EditorGroupViewCtrl extends PureViewCtrl<unknown, {
  showMultipleSelectedNotes: boolean
}> {

  public editors: Editor[] = []

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService,) {
    super($timeout);
    this.state = {
      showMultipleSelectedNotes: false
    };
  }

  $onInit() {
    this.application.editorGroup.addChangeObserver(() => {
      this.editors = this.application.editorGroup.editors;
    });
    this.autorun(() => {
      this.setState({
        showMultipleSelectedNotes: this.appState.notes.selectedNotesCount > 1
      });
    });
  }
}

export class EditorGroupView extends WebDirective {
  constructor() {
    super();
    this.template = template;
    this.controller = EditorGroupViewCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      application: '='
    };
  }
}
