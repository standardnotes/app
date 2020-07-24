import { WebApplication } from '@/ui_models/application';
import { WebDirective } from './../../types';
import template from './editor-group-view.pug';
import { Editor } from '@/ui_models/editor';

class EditorGroupViewCtrl {

  private application!: WebApplication
  public editors: Editor[] = []

  /* @ngInject */
  constructor() {

  }

  $onInit() {
    this.application.editorGroup.addChangeObserver(() => {
      this.editors = this.application.editorGroup.editors;
    })
  }
}

export class EditorGroupView extends WebDirective {
  constructor() {
    super();
    this.template = template;
    this.controller = EditorGroupViewCtrl;
    this.replace = true;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      application: '='
    };
  }
}
