import { WebDirective } from './../../types';
import template from './editor-group-view.pug';
import { NoteController } from '@/ui_models/note_controller';
import { PureViewCtrl } from '../abstract/pure_view_ctrl';

class EditorGroupViewCtrl extends PureViewCtrl<
  unknown,
  {
    showMultipleSelectedNotes: boolean;
  }
> {
  public controllers: NoteController[] = [];

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService) {
    super($timeout);
    this.state = {
      showMultipleSelectedNotes: false,
    };
  }

  $onInit() {
    this.application.noteControllerGroup.addChangeObserver(() => {
      this.controllers = this.application.noteControllerGroup.noteControllers;
    });
    this.autorun(() => {
      this.setState({
        showMultipleSelectedNotes: this.appState.notes.selectedNotesCount > 1,
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
      application: '=',
    };
  }
}
