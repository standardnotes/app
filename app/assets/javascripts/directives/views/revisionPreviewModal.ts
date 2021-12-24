import { ComponentViewer } from '@standardnotes/snjs/dist/@types';
import { PureViewCtrl } from './../../views/abstract/pure_view_ctrl';
import { WebApplication } from '@/ui_models/application';
import { WebDirective } from './../../types';
import { ContentType, PayloadSource, SNNote } from '@standardnotes/snjs';
import template from '%/directives/revision-preview-modal.pug';
import { PayloadContent } from '@standardnotes/snjs';
import { confirmDialog } from '@/services/alertService';
import { STRING_RESTORE_LOCKED_ATTEMPT } from '@/strings';

interface RevisionPreviewScope {
  uuid: string;
  content: PayloadContent;
  application: WebApplication;
}

type State = {
  componentViewer?: ComponentViewer;
};

class RevisionPreviewModalCtrl
  extends PureViewCtrl<unknown, State>
  implements RevisionPreviewScope
{
  $element: JQLite;
  $timeout: ng.ITimeoutService;
  uuid!: string;
  content!: PayloadContent;
  title?: string;
  application!: WebApplication;
  note!: SNNote;
  private originalNote!: SNNote;

  /* @ngInject */
  constructor($element: JQLite, $timeout: ng.ITimeoutService) {
    super($timeout);
    this.$element = $element;
    this.$timeout = $timeout;
  }

  $onInit() {
    this.configure();
    super.$onInit();
  }

  $onDestroy() {
    if (this.state.componentViewer) {
      this.application.componentManager.destroyComponentViewer(
        this.state.componentViewer
      );
    }
    super.$onDestroy();
  }

  get componentManager() {
    return this.application.componentManager;
  }

  async configure() {
    this.note = (await this.application.createTemplateItem(
      ContentType.Note,
      this.content
    )) as SNNote;
    this.originalNote = this.application.findItem(this.uuid) as SNNote;
    const component = this.componentManager.editorForNote(this.originalNote);
    if (component) {
      const componentViewer =
        this.application.componentManager.createComponentViewer(component);
      componentViewer.setReadonly(true);
      componentViewer.lockReadonly = true;
      componentViewer.overrideContextItem = this.note;
      this.setState({ componentViewer });
    }
  }

  restore(asCopy: boolean) {
    const run = async () => {
      if (asCopy) {
        await this.application.duplicateItem(this.originalNote, {
          ...this.content,
          title: this.content.title
            ? this.content.title + ' (copy)'
            : undefined,
        });
      } else {
        this.application.changeAndSaveItem(
          this.uuid,
          (mutator) => {
            mutator.unsafe_setCustomContent(this.content);
          },
          true,
          PayloadSource.RemoteActionRetrieved
        );
      }
      this.dismiss();
    };

    if (!asCopy) {
      if (this.originalNote.locked) {
        this.application.alertService.alert(STRING_RESTORE_LOCKED_ATTEMPT);
        return;
      }
      confirmDialog({
        text: "Are you sure you want to replace the current note's contents with what you see in this preview?",
        confirmButtonStyle: 'danger',
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
      title: '=',
      application: '=',
    };
  }
}
