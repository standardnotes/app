import { WebApplication } from '@/ui_models/application';
import { WebDirective } from './../../types';
import {
  ContentType,
  PayloadSource,
  SNComponent,
  SNNote,
  ComponentArea
} from 'snjs';
import template from '%/directives/revision-preview-modal.pug';
import { PayloadContent } from '@node_modules/snjs/dist/@types/protocol/payloads/generator';

interface RevisionPreviewScope {
  uuid: string
  content: PayloadContent
  application: WebApplication
}

class RevisionPreviewModalCtrl implements RevisionPreviewScope {

  $element: JQLite
  $timeout: ng.ITimeoutService
  uuid!: string
  content!: PayloadContent
  application!: WebApplication
  unregisterComponent?: any
  note!: SNNote
  editor?: SNComponent

  /* @ngInject */
  constructor(
    $element: JQLite,
    $timeout: ng.ITimeoutService
  ) {
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
    const originalNote = this.application.findItem(this.uuid) as SNNote;
    const editorForNote = this.componentManager.editorForNote(originalNote);
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
          if (componentUuid === this.editor?.uuid) {
            return this.note;
          }
        },
        componentForSessionKeyHandler: (key) => {
          if (key === this.componentManager.sessionKeyForComponent(this.editor!)) {
            return this.editor;
          }
        }
      });

      this.editor = editorCopy;
    }
  }

  restore(asCopy: boolean) {
    const run = async () => {
      if (asCopy) {
        const contentCopy = Object.assign({}, this.content);
        if (contentCopy.title) {
          contentCopy.title += " (copy)";
        }
        await this.application.createManagedItem(
          ContentType.Note,
          contentCopy,
          true
        );
      } else {
        this.application.changeAndSaveItem(this.uuid, (mutator) => {
          mutator.setContent(this.content);
        }, true, PayloadSource.RemoteActionRetrieved);
      }
      this.dismiss();
    };

    if (!asCopy) {
      this.application.alertService!.confirm(
        "Are you sure you want to replace the current note's contents with what you see in this preview?",
        undefined,
        undefined,
        undefined,
        run,
        undefined,
        true,
      );
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
