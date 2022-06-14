import React from 'react';
import ComponentRelay from '@standardnotes/component-relay';

export default class Home extends React.Component {

  constructor(props) {
    super(props);

    this.state = {};

    this.connectToBridge();

    this.numRows = 75;
    this.numColumns = 26;
    this.sheetSizeUpdated = false;
  }

  componentDidMount() {
    $(function() {
      $('#spreadsheet').kendoSpreadsheet({
        rows: this.numRows,
        columns: this.numColumns,
        change: this.onChange,
        changeFormat: this.onChange, // triggered when cell structure changes (currency, date, etc)
        excelImport: (event) => {
          // Excel import functionality has been disabled completely.
          // We'll keep this code around below incase we enable it again in the future.
          if (!confirm('Importing will completely overwrite any existing data. Are you sure you want to continue?')) {
            event.preventDefault();
            return;
          }

          if (!confirm('Note that importing from Excel may cause very large file sizes within Standard Notes, which may affect performance. You may continue with import, but if you notice performance issues, it is recommended you manually import data instead.')) {
            event.preventDefault();
            return;
          }

          event.promise.done(() => {
            console.log('Import complete');
            this.onChange();
          });

        },
        insertSheet: this.onChange,
        removeSheet: this.onChange,
        renameSheet: this.onChange,
        unhideColumn: this.onChange,
        unhideRow: this.onChange,
        hideColumn: this.onChange,
        hideRow: this.onChange,
        deleteColumn: this.onChange,
        deleteRow: this.onChange,
        insertColumn: (_event) => {
          this.numColumns++;
          this.sheetSizeUpdated = true;
          this.onChange();
        },
        insertRow: () => {
          this.numRows++;
          this.sheetSizeUpdated = true;
          this.onChange();
        },
        render: () => {
          if (!this.sheetSizeUpdated) {
            return;
          }
          /**
           * To update the sheet size when a new column/row is inserted, we need to:
           * 1. Rebuild the spreadsheet with the current data
           * 2. Immediately save the note
           */
          this.sheetSizeUpdated = false;
          this.getSpreadsheet().fromJSON(this.getJSON());
          this.onChange();
        }
      });

      this.reloadSpreadsheetContent();

      $('.k-item, .k-button').click(() => {
        setTimeout(() => {
          this.onChange();
        }, 10);
      });

      // remove import option
      $('.k-upload-button').remove();
    }.bind(this));
  }

  getSpreadsheet() {
    return $('#spreadsheet').getKendoSpreadsheet();
  }

  onChange = () => {
    if (!this.note) {
      return;
    }

    this.saveSpreadsheet();
  }

  saveSpreadsheet() {
    // Be sure to capture this object as a variable, as this.note may be reassigned in `streamContextItem`, so by the time
    // you modify it in the presave block, it may not be the same object anymore, so the presave values will not be applied to
    // the right object, and it will save incorrectly.
    const note = this.note;

    this.componentRelay.saveItemWithPresave(note, () => {
      note.content.preview_html = null;
      note.content.preview_plain = 'Created with Secure Spreadsheets';

      const json = this.getJSON();
      const content = JSON.stringify(json);
      note.content.text = content;
    });
  }

  getJSON() {
    const json = this.getSpreadsheet().toJSON();
    json.rows = this.numRows;
    json.columns = this.numColumns;
    return json;
  }

  connectToBridge() {
    this.componentRelay = new ComponentRelay({
      targetWindow: window,
      onReady: () => {
        const { platform } = this.componentRelay;
        if (platform) {
          document.body.classList.add(platform);
        }
      }
    });

    this.componentRelay.streamContextItem((note) => {
      this.note = note;

      // Only update UI on non-metadata updates.
      if (note.isMetadataUpdate) {
        return;
      }

      this.reloadSpreadsheetContent();
    });
  }

  reloadSpreadsheetContent() {
    if (!this.note) {
      return;
    }

    const text = this.note.content.text;

    /**
     * If the note's text is empty, we want to save the note
     * so that the empty string is replaced with a JSON string
     * that is readable by the editor.
     */
    if (text.length === 0) {
      this.saveSpreadsheet();
    }

    const json = JSON.parse(text);
    if (json.rows) {
      this.numRows = json.rows;
    }

    if (json.columns) {
      this.numColumns = json.columns;
    }
    this.getSpreadsheet().fromJSON(json);
    this.getSpreadsheet().refresh();
  }

  render() {
    return (
      <div></div>
    );
  }
}
