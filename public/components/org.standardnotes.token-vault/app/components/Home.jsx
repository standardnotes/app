import React from 'react';
import update from 'immutability-helper';
import EditEntry from '@Components/EditEntry';
import ViewEntries from '@Components/ViewEntries';
import ConfirmDialog from '@Components/ConfirmDialog';
import DataErrorAlert from '@Components/DataErrorAlert';
import EditorKit from '@standardnotes/editor-kit';
import ReorderIcon from '../assets/svg/reorder-icon.svg';

const initialState = {
  text: '',
  entries: [],
  parseError: false,
  editMode: false,
  editEntry: null,
  confirmRemove: false,
  confirmReorder: false,
  displayCopy: false,
  canEdit: true,
  searchValue: '',
  lastUpdated: 0
};

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.configureEditorKit();
    this.state = initialState;
  }

  configureEditorKit() {
    const delegate = {
      setEditorRawText: text => {
        let parseError = false;
        let entries = [];

        if (text) {
          try {
            entries = JSON.parse(text);
          } catch (e) {
            // Couldn't parse the content
            parseError = true;
            this.setState({
              parseError: true
            });
          }
        }

        this.setState({
          ...initialState,
          text,
          parseError,
          entries
        });
      },
      generateCustomPreview: text => {
        let entries = [];
        try {
          entries = JSON.parse(text);
        } finally {
          // eslint-disable-next-line no-unsafe-finally
          return {
            html: `<div><strong>${entries.length}</strong> TokenVault Entries </div>`,
            plain: `${entries.length} TokenVault Entries`,
          };
        }
      },
      clearUndoHistory: () => { },
      getElementsBySelector: () => [],
      onNoteLockToggle: (isLocked) => {
        this.setState({
          canEdit: !isLocked
        });
      },
      onThemesChange: () => {
        this.setState({
          lastUpdated: Date.now(),
        });
      }
    };

    this.editorKit = new EditorKit(delegate, {
      mode: 'json',
      supportsFileSafe: false
    });
  }

  saveNote(entries) {
    this.editorKit.onEditorValueChanged(JSON.stringify(entries, null, 2));
  }

  // Entry operations
  addEntry = entry => {
    this.setState(state => {
      const entries = state.entries.concat([entry]);
      this.saveNote(entries);

      return {
        editMode: false,
        editEntry: null,
        entries
      };
    });
  };

  editEntry = ({ id, entry }) => {
    this.setState(state => {
      const entries = update(state.entries, { [id]: { $set: entry } });
      this.saveNote(entries);

      return {
        editMode: false,
        editEntry: null,
        entries
      };
    });
  };

  removeEntry = id => {
    this.setState(state => {
      const entries = update(state.entries, { $splice: [[id, 1]] });
      this.saveNote(entries);

      return {
        confirmRemove: false,
        editEntry: null,
        entries
      };
    });
  };

  // Event Handlers
  onAddNew = () => {
    if (!this.state.canEdit) {
      return;
    }
    this.setState({
      editMode: true,
      editEntry: null
    });
  };

  onEdit = id => {
    if (!this.state.canEdit) {
      return;
    }
    this.setState(state => ({
      editMode: true,
      editEntry: {
        id,
        entry: state.entries[id]
      }
    }));
  };

  onCancel = () => {
    this.setState({
      confirmRemove: false,
      confirmReorder: false,
      editMode: false,
      editEntry: null
    });
  };

  onRemove = id => {
    if (!this.state.canEdit) {
      return;
    }
    this.setState(state => ({
      confirmRemove: true,
      editEntry: {
        id,
        entry: state.entries[id]
      }
    }));
  };

  onSave = ({ id, entry }) => {
    // If there's no ID it's a new note
    if (id != null) {
      this.editEntry({ id, entry });
    } else {
      this.addEntry(entry);
    }
  };

  onCopyValue = () => {
    this.setState({
      displayCopy: true
    });

    if (this.clearTooltipTimer) {
      clearTimeout(this.clearTooltipTimer);
    }

    this.clearTooltipTimer = setTimeout(() => {
      this.setState({
        displayCopy: false
      });
    }, 2000);
  };

  updateEntries = (entries) => {
    this.saveNote(entries);
    this.setState({
      entries
    });
  };

  onReorderEntries = () => {
    if (!this.state.canEdit) {
      return;
    }
    this.setState({
      confirmReorder: true
    });
  };

  onSearchChange = event => {
    const target = event.target;
    this.setState({
      searchValue: target.value.toLowerCase()
    });
  };

  clearSearchValue = () => {
    this.setState({
      searchValue: ''
    });
  }

  reorderEntries = () => {
    const { entries } = this.state;
    const orderedEntries = entries.sort((a, b) => {
      const serviceA = a.service.toLowerCase();
      const serviceB = b.service.toLowerCase();
      return (serviceA < serviceB) ? -1 : (serviceA > serviceB) ? 1 : 0;
    });
    this.saveNote(orderedEntries);
    this.setState({
      entries: orderedEntries,
      confirmReorder: false
    });
  };

  render() {
    const editEntry = this.state.editEntry || {};
    const {
      canEdit,
      displayCopy,
      parseError,
      editMode,
      entries,
      confirmRemove,
      confirmReorder,
      searchValue,
      lastUpdated
    } = this.state;

    return (
      <div className="sn-component">
        <div className={`auth-copy-notification ${displayCopy ? 'visible' : 'hidden'}`}>
          <div className="sk-panel">
            <div className="sk-font-small sk-bold">
              Copied value to clipboard.
            </div>
          </div>
        </div>
        {parseError && <DataErrorAlert />}
        {!editMode && (
          <div id="header">
            <div className={`sk-horizontal-group left align-items-center ${!canEdit && 'full-width'}`}>
              <input
                name="search"
                className="sk-input contrast search-bar"
                placeholder="Search entries..."
                value={searchValue}
                onChange={this.onSearchChange}
                autoComplete="off"
                type="text"
              />
              {searchValue && (
                <div onClick={this.clearSearchValue} className="sk-button danger">
                  <div className="sk-label">✕</div>
                </div>
              )}
            </div>
            {canEdit && (
              <div className="sk-horizontal-group right">
                <div className="sk-button-group stretch">
                  <div onClick={this.onReorderEntries} className="sk-button info">
                    <ReorderIcon />
                  </div>
                  <div onClick={this.onAddNew} className="sk-button info">
                    <div className="sk-label">Add new</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div id="content">
          {editMode ? (
            <EditEntry
              id={editEntry.id}
              entry={editEntry.entry}
              onSave={this.onSave}
              onCancel={this.onCancel}
            />
          ) : (
            <ViewEntries
              entries={entries}
              searchValue={searchValue}
              onEdit={this.onEdit}
              onRemove={this.onRemove}
              onCopyValue={this.onCopyValue}
              canEdit={canEdit}
              lastUpdated={lastUpdated}
              updateEntries={this.updateEntries}
            />
          )}
          {confirmRemove && (
            <ConfirmDialog
              title={`Remove ${editEntry.entry.service}`}
              message="Are you sure you want to remove this entry?"
              onConfirm={() => this.removeEntry(editEntry.id)}
              onCancel={this.onCancel}
            />
          )}
          {confirmReorder && (
            <ConfirmDialog
              title={'Auto-sort entries'}
              message="Are you sure you want to auto-sort all entries alphabetically based on service name?"
              onConfirm={this.reorderEntries}
              onCancel={this.onCancel}
            />
          )}
        </div>
      </div>
    );
  }
}
