import Task from '@Models/Task';
import ComponentRelay from '@standardnotes/component-relay';

const TaskDelimitter = '\n';

export default class TasksManager {
  spellcheckEnabled = true

  /* Singleton */
  static instance = null;
  static get() {
    if (this.instance === null) { 
      this.instance = new TasksManager();
    }
    return this.instance;
  }

  initiateBridge() {
    const permissions = [
      {
        name: 'stream-context-item'
      }
    ];

    this.componentRelay = new ComponentRelay({
      targetWindow: window,
      permissions,
      onReady: () => {
        this.onReady && this.onReady();
      }
    });

    this.componentRelay.streamContextItem((note) => {
      this.note = note;

      if (note.isMetadataUpdate) {
        return;
      }

      this.dataString = note.content.text;
      this.unsavedTask = note.content.unsavedTask;
      this.reloadData();
      this.dataChangeHandler && this.dataChangeHandler(this.tasks);
      this.spellcheckEnabled = JSON.stringify(note.content.spellcheck);
    });
  }

  getPlatform() {
    return this.componentRelay.platform;
  }

  isMobile() {
    return this.componentRelay && this.componentRelay.isRunningInMobileApplication();
  }

  get showTutorial() {
    const showTutorial = this.componentRelay.getComponentDataValueForKey('showTutorial');
    return showTutorial === undefined;
  }

  setOnReady(onReady) {
    this.onReady = onReady;
  }

  setDataChangeHandler(handler) {
    this.dataChangeHandler = handler;
  }

  parseRawTasksString(string) {
    if (!string) {string = '';}
    const allTasks = string.split(TaskDelimitter);
    return allTasks.filter((s) => {return s.replace(/ /g, '').length > 0;}).map((rawString) => {
      return this.createTask(rawString);
    });
  }

  keyForTask(task) {
    return this.tasks.indexOf(task) + task.rawString;
  }

  reloadData() {
    this.tasks = this.parseRawTasksString(this.dataString);
  }

  getTasks() {
    if (!this.tasks) {
      this.reloadData();
    }
    return this.tasks;
  }

  createTask(rawString) {
    return new Task(rawString);
  }

  addTask(task) {
    this.tasks.unshift(task);
    this.save();
    this.reloadData();
  }

  setUnsavedTask(text) {
    this.unsavedTask = text;
  }

  completedTasks() {
    return this.tasks.filter((task) => task.completed == true);
  }

  openTasks(tasks) {
    tasks.forEach(task => {
      task.markOpen();
    });

    this.tasks = this.categorizedTasks.openTasks.concat(tasks);
  }

  removeTasks(tasks) {
    this.tasks = this.tasks.filter((task) => !tasks.includes(task));
  }

  // Splits into completed and non completed piles, and organizes them into an ordered array
  splitTasks() {
    let tasks = this.getTasks();
    const openTasks = [], completedTasks = [];
    tasks.forEach((task) => {
      if (task.completed) {
        completedTasks.push(task);
      } else {
        openTasks.push(task);
      }
    });

    this.tasks = openTasks.concat(completedTasks);
    this.categorizedTasks = {
      unsavedTask: this.unsavedTask,
      openTasks,
      completedTasks
    };

    return this.categorizedTasks;
  }

  moveTaskToTop(task) {
    this.tasks.splice(this.tasks.indexOf(task), 1);
    this.tasks.unshift(task);
  }

  changeTaskPosition(task, taskOccupyingTargetLocation) {
    const from = this.tasks.indexOf(task);
    const to = this.tasks.indexOf(taskOccupyingTargetLocation);

    this.tasks = this.tasks.move(from, to);
  }

  reopenCompleted() {
    this.openTasks(this.completedTasks());
    this.save();
  }

  deleteCompleted() {
    this.removeTasks(this.completedTasks());
    this.save();
  }

  deleteTask(task) {
    this.removeTasks([task]);
    this.save();
  }

  buildHtmlPreview() {
    const { openTasks, completedTasks } = this.categorizedTasks;
    const totalLength = openTasks.length + completedTasks.length;

    const taskPreviewLimit = 3;
    const tasksToPreview = Math.min(openTasks.length, taskPreviewLimit);

    let html = '<div>';
    html += `<div style="margin-top: 8px;"><strong>${completedTasks.length}/${totalLength} tasks completed</strong></div>`;
    html += `<progress max="100" style="margin-top: 10px; width: 100%;" value="${(completedTasks.length/totalLength) * 100}"></progress>`;

    if (tasksToPreview > 0) {
      html += '<ul style=\'padding-left: 19px; margin-top: 10px;\'>';
      for (let i = 0; i < tasksToPreview; i++) {
        const task = openTasks[i];
        html += `<li style='margin-bottom: 6px;'>${task.content}</li>`;
      }
      html += '</ul>';

      if (openTasks.length > tasksToPreview) {
        const diff = openTasks.length - tasksToPreview;
        const noun = diff == 1 ? 'task' : 'tasks';
        html += `<div><strong>And ${diff} other open ${noun}.</strong></div>`;
      }
    }

    html += '</div>';

    return html;
  }

  buildPlainPreview() {
    const { openTasks, completedTasks } = this.categorizedTasks;
    const totalLength = openTasks.length + completedTasks.length;

    return `${completedTasks.length}/${totalLength} tasks completed.`;
  }

  save() {
    this.dataString = this.tasks.map((task) => task.rawString).join(TaskDelimitter);

    if (this.note) {
      // Be sure to capture this object as a variable, as this.note may be reassigned in `streamContextItem`, so by the time
      // you modify it in the presave block, it may not be the same object anymore, so the presave values will not be applied to
      // the right object, and it will save incorrectly.
      let note = this.note;
      this.componentRelay.saveItemWithPresave(note, () => {
        // required to build dynamic previews
        this.splitTasks();
        note.content.text = this.dataString;
        note.content.unsavedTask = this.unsavedTask;
        note.content.preview_html = this.buildHtmlPreview();
        note.content.preview_plain = this.buildPlainPreview();
      });

      if (this.showTutorial) {
        this.componentRelay.setComponentDataValueForKey('showTutorial', false);
      }
    }
  }

}

Array.prototype.move = function (old_index, new_index) {
  while (old_index < 0) {
    old_index += this.length;
  }
  while (new_index < 0) {
    new_index += this.length;
  }
  if (new_index >= this.length) {
    let k = new_index - this.length;
    while ((k--) + 1) {
      this.push(undefined);
    }
  }
  this.splice(new_index, 0, this.splice(old_index, 1)[0]);
  return this; // for testing purposes
};
