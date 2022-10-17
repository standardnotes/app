import React from 'react';
import FilesafeEmbed from "filesafe-embed";
import Filesafe from "filesafe-js";
import ComponentManager from 'sn-components-api';

const BaseHeight = 53;
const MessageHavingHeight = 28;
const PerMessageHeight = 22;
const ExpandedHeight = 305;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {expanded: false};
  }

  componentDidMount() {
    this.componentManager = new ComponentManager(null, () => {
      // On ready and permissions authorization
      document.documentElement.classList.add(this.componentManager.platform);
    });

    this.filesafe = new Filesafe({componentManager: this.componentManager});
    this.fsObserver = this.filesafe.addDataChangeObserver(() => {
      this.recomputeHeight();
    })

    this.componentManager.streamContextItem((incomingNote) => {
      let itemClass = Filesafe.getSFItemClass();
      let noteModel = new itemClass(incomingNote);
      this.filesafe.setCurrentNote(noteModel);
    });

    let delegate = {
      onSelectFile: (fileDescriptor) => {
        if(fileDescriptor) {
          if(!this.state.expanded) {
            this.expandedFromSelection = true;
            this.expandForFileSelection();
          }
        } else {
          if(this.expandedFromSelection)  {
            this.collapse();
            this.expandedFromSelection = false;
          }
        }
      }
    }

    let mountPoint = document.getElementById("embed");
    FilesafeEmbed.FilesafeEmbed.renderInElement(mountPoint, this.filesafe, delegate);

    this.recomputeHeight();
  }

  recomputeHeight() {
    var totalHeight = BaseHeight;

    var credentials = this.filesafe.getAllCredentials();
    if(credentials.length == 0) {
      totalHeight += PerMessageHeight;
    }

    var integrations = this.filesafe.getAllIntegrations();
    if(integrations.length == 0) {
      totalHeight += PerMessageHeight;
    }

    if(integrations.length == 0 || credentials.length == 0) {
      totalHeight += MessageHavingHeight;
    }

    if(this.state.expanded) {
      totalHeight = ExpandedHeight;
    }

    this.componentManager.setSize("container", "100%", totalHeight);
  }

  toggleHeight() {
    if(this.state.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  expandForFileSelection() {
    this.componentManager.setSize("container", "100%", 130);
  }

  expand() {
    this.setState({expanded: true}, this.recomputeHeight)
  }

  collapse() {
    this.setState({expanded: false}, this.recomputeHeight);
  }

  render() {
    return (
      <div id="root">
        <div id="embed">
        </div>
        <div id="expand-button" className="sk-button contrast no-border" onClick={this.toggleHeight.bind(this)}>
          <div className="sk-label">{this.state.expanded ? "▲" : "▼"}</div>
        </div>
      </div>
    );
  }
}
