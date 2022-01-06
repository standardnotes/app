import { WebDirective } from './../../types';
import template from './note-group-view.pug';
import { PureViewCtrl } from '../abstract/pure_view_ctrl';
import { NoteViewController } from '@standardnotes/snjs';

class NoteGroupView extends PureViewCtrl<
  unknown,
  {
    showMultipleSelectedNotes: boolean;
  }
> {
  public controllers: NoteViewController[] = [];

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService) {
    super($timeout);
    this.state = {
      showMultipleSelectedNotes: false,
    };
  }

  $onInit() {
    this.application.noteControllerGroup.addActiveControllerChangeObserver(
      () => {
        this.controllers = this.application.noteControllerGroup.noteControllers;
      }
    );
    this.autorun(() => {
      this.setState({
        showMultipleSelectedNotes: this.appState.notes.selectedNotesCount > 1,
      });
    });
  }
}

export class NoteGroupViewDirective extends WebDirective {
  constructor() {
    super();
    this.template = template;
    this.controller = NoteGroupView;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      application: '=',
    };
  }
}
