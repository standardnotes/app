export default class Task {

  static OpenPrefix      = '- [ ] ';
  static AllowedPrefixes = /^- \[x\] /i;
  static CompletedPrefix = '- [x] ';

  constructor(rawString) {
    this.rawString = rawString;

    // allow both capital and lowercase X on completed when parsing
    this.completed = Task.AllowedPrefixes.test(rawString);

    if (!this.completed && !rawString.startsWith(Task.OpenPrefix)) {
      // This is a text being created from user input, prepend open prefix
      this.rawString = Task.OpenPrefix + this.rawString;
    }
  }

  get content() {
    return this.rawString.replace(Task.OpenPrefix, '').replace(Task.AllowedPrefixes, '');
  }

  isEmpty() {
    return this.content.replace(/ /g, '').length == 0;
  }

  toggleStatus() {
    this.completed = !this.completed;
    this.updateRawString();
  }

  markCompleted() {
    this.completed = true;
    this.updateRawString();
  }

  markOpen() {
    this.completed = false;
    this.updateRawString();
  }

  setContentString(string) {
    this.rawString = string;
    if (this.completed) {
      this.rawString = Task.CompletedPrefix + this.rawString;
    } else {
      this.rawString = Task.OpenPrefix + this.rawString;
    }
  }

  updateRawString() {
    if (this.completed) {
      this.rawString = this.rawString.replace(Task.OpenPrefix, Task.CompletedPrefix);
    } else {
      this.rawString = this.rawString.replace(Task.AllowedPrefixes, Task.OpenPrefix);
    }
  }
}
