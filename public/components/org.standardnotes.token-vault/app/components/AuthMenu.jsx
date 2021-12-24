import React from 'react';
import PropTypes from 'prop-types';

export default class AuthMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false
    };
  }

  onToggle = () => {
    this.setState({
      show: !this.state.show
    });
  }

  onEdit = () => {
    this.onToggle();
    this.props.onEdit();
  }

  onRemove = () => {
    this.onToggle();
    this.props.onRemove();
  }

  render() {
    const { buttonColor } = this.props;

    const buttonStyle = {};
    if (buttonColor) {
      buttonStyle.color = buttonColor;
    }

    return (
      <div className="auth-menu">
        <div className="sk-button" onClick={this.onToggle} style={buttonStyle}>
          <div className="sk-label">•••</div>
        </div>
        {this.state.show && (
          <div className="auth-overlay" onClick={this.onToggle} />,
          <div className="sk-menu-panel">
            <div className="sk-menu-panel-row" onClick={this.onEdit}>
              <div className="sk-label">Edit</div>
            </div>
            <div className="sk-menu-panel-row" onClick={this.onRemove}>
              <div className="sk-label">Remove</div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

AuthMenu.propTypes = {
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  buttonColor: PropTypes.string
};
