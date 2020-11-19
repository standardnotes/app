import { PureViewCtrl } from './../../views/abstract/pure_view_ctrl';
import { WebApplication } from '@/ui_models/application';
import { WebDirective } from './../../types';
import {
  PayloadContent,
  ContentType,
  PayloadSource,
  SNComponent,
  SNNote,
  ComponentArea
} from '@standardnotes/snjs';
import template from '%/directives/revision-preview-modal.pug';
import { confirmDialog } from '@/services/alertService';

interface RevisionPreviewScope {
  uuid: string
  content: PayloadContent
  application: WebApplication
}

class RevisionPreviewModalCtrl extends PureViewCtrl implements RevisionPreviewScope {

  $element: JQLite
  $timeout: ng.ITimeoutService
  uuid!: string
  content!: PayloadContent
  application!: WebApplication
  unregisterComponent?: any
  note!: SNNote
  private originalNote!: SNNote;

  /* @ngInject */
  constructor(
    $element: JQLite,
    $timeout: ng.ITimeoutService
  ) {
    super($timeout);
    this.$element = $element;
    this.$timeout = $timeout;
  }

  $onInit() {
    this.configure();
  }

  $onDestroy() {
    if (this.unregisterComponent) {
      this.unregisterComponent();
      this.unregisterComponent = undefined;
    }
  }

  get componentManager() {
    return this.application.componentManager!;
  }

  async configure() {
    this.note = await this.application.createTemplateItem(
      ContentType.Note,
      this.content
    ) as SNNote;
    this.originalNote = this.application.findItem(this.uuid) as SNNote;
    const editorForNote = this.componentManager.editorForNote(this.originalNote);
    if (editorForNote) {
      /**
       * Create temporary copy, as a lot of componentManager is uuid based, so might
       * interfere with active editor. Be sure to copy only the content, as the top level
       * editor object has non-copyable properties like .window, which cannot be transfered
       */
      const editorCopy = await this.application.createTemplateItem(
        ContentType.Component,
        editorForNote.safeContent
      ) as SNComponent;
      this.componentManager.setReadonlyStateForComponent(editorCopy, true, true);
      this.unregisterComponent = this.componentManager.registerHandler({
        identifier: editorCopy.uuid,
        areas: [ComponentArea.Editor],
        contextRequestHandler: (componentUuid) => {
          if (componentUuid === this.state.editor?.uuid) {
            return this.note;
          }
        },
        componentForSessionKeyHandler: (key) => {
          if (key === this.componentManager.sessionKeyForComponent(this.state.editor!)) {
            return this.state.editor;
          }
        }
      });

      this.setState({editor: editorCopy});
    }
  }

  restore(asCopy: boolean) {
    const run = async () => {
      if (asCopy) {
        await this.application.duplicateItem(this.originalNote, {
          ...this.content,
          title: this.content.title ? this.content.title + ' (copy)' : undefined
        });
      } else {
        this.application.changeAndSaveItem(this.uuid, (mutator) => {
          mutator.setContent(this.content);
        }, true, PayloadSource.RemoteActionRetrieved);
      }
      this.dismiss();
    };

    if (!asCopy) {
      confirmDialog({
        text: "Are you sure you want to replace the current note's contents with what you see in this preview?",
        confirmButtonStyle: "danger"
      }).then((confirmed) => {
        if (confirmed) {
          run();
        }
      });
    } else {
      run();
    }
  }

  dismiss() {
    const elem = this.$element;
    const scope = elem.scope();
    scope.$destroy();
    elem.remove();
  }
}

export class RevisionPreviewModal extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = RevisionPreviewModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      uuid: '=',
      content: '=',
      application: '='
    };
  }
}
