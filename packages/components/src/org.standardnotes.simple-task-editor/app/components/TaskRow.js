import React, { Component } from 'react';
import PropTypes from 'prop-types';

class TaskRow extends Component {
  constructor(props) {
    super(props);
    this.state = { isChecked: props.task.completed, task: props.task };
  }

  componentDidMount() {
    this.resizeTextArea(this.textArea);
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    this.setState({ task: newProps.task, isChecked: newProps.task.completed });

    // Wait till after render
    setTimeout(() => {
      this.resizeTextArea(this.textArea);
    }, 1);
  }

  toggleCheckboxChange = () => {
    const { handleCheckboxChange } = this.props;

    this.setState(({ isChecked }) => ({
      isChecked: !isChecked
    }));

    handleCheckboxChange(this.props.task);
  }

  onTextChange = (event) => {
    const text = event.target.value;
    this.props.task.setContentString(text);
    this.props.handleTextChange(this.props.task, text);

    this.forceUpdate();
  }

  onKeyUp = (event) => {
    // Delete task if empty and enter pressed
    if (event.keyCode == 13) {
      if (this.props.task.isEmpty()) {
        this.props.deleteTask(this.props.task);
        event.preventDefault();
      }
    }
    const element = event.target;
    this.resizeTextArea(element);
  }

  onKeyPress = (event) => {
    if (event.key == 'Enter') {
      // We want to disable any action on enter, since newlines are reserved
      // and are how tasks are delimitted.
      event.preventDefault();
    }
  }

  resizeTextArea(textarea) {
    // set to 1 first to reset scroll height in case it shrunk
    textarea.style.height = '1px';
    textarea.style.height = (textarea.scrollHeight)+'px';
  }

  render() {
    const { isChecked } = this.state;
    const { task, spellcheckEnabled } = this.props;

    const classes = `task ${task.completed ? 'completed' : ''}`;
    return (
      <div className={classes}>

        <label className="checkbox-container">
          <input
            type="checkbox"
            value={task.content}
            checked={isChecked}
            onChange={this.toggleCheckboxChange}
            className="checkbox"
            spellCheck={spellcheckEnabled}
          />
          <span className="checkmark"></span>
        </label>

        <textarea
          ref={(textarea) => {this.textArea = textarea;}}
          value={task.content}
          onChange={this.onTextChange}
          onKeyUp={this.onKeyUp}
          onKeyPress={this.onKeyPress}
          type="text"
          dir="auto"
          className='task-input-textarea'
          spellCheck={spellcheckEnabled}
        />
      </div>
    );
  }
}

TaskRow.propTypes = {
  task: PropTypes.object.isRequired,
  handleCheckboxChange: PropTypes.func.isRequired,
  handleTextChange: PropTypes.func.isRequired,
  deleteTask: PropTypes.func.isRequired,
  spellcheckEnabled: PropTypes.bool.isRequired
};

export default TaskRow;
