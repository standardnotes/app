import template from '%/directives/conflict-resolution-modal.pug';

class ConflictResolutionCtrl {
  /* @ngInject */
  constructor(
    $element,
    alertManager,
    archiveManager,
    modelManager,
    syncManager
  ) {
    this.$element = $element;
    this.alertManager = alertManager;
    this.archiveManager = archiveManager;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
  }

  $onInit() {
    this.contentType = this.item1.content_type;
    this.item1Content = this.createContentString(this.item1);
    this.item2Content = this.createContentString(this.item2);
  };

  createContentString(item) {
    const data = Object.assign({
      created_at: item.created_at,
      updated_at: item.updated_at
    }, item.content);
    return JSON.stringify(data, null, 2);
  }

  keepItem1() {
    this.alertManager.confirm({
      text: `Are you sure you want to delete the item on the right?`,
      destructive: true,
      onConfirm: () => {
        this.modelManager.setItemToBeDeleted(this.item2);
        this.syncManager.sync().then(() => {
          this.applyCallback();
        });
        this.dismiss();
      }
    });
  }

  keepItem2() {
    this.alertManager.confirm({
      text: `Are you sure you want to delete the item on the left?`,
      destructive: true,
      onConfirm: () => {
        this.modelManager.setItemToBeDeleted(this.item1);
        this.syncManager.sync().then(() => {
          this.applyCallback();
        });
        this.dismiss();
      }
    });
  }

  keepBoth() {
    this.applyCallback();
    this.dismiss();
  }

  export() {
    this.archiveManager.downloadBackupOfItems(
      [this.item1, this.item2],
      true
    );
  }

  applyCallback() {
    this.callback && this.callback();
  }

  dismiss() {
    this.$element.remove();
  }
}

export class ConflictResolutionModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = ConflictResolutionCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      item1: '=',
      item2: '=',
      callback: '='
    };
  }
}
