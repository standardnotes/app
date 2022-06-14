import React from 'react';
import PropTypes from 'prop-types';

const CopyNotification = ({ isVisible }) => (
  <div
    className={`auth-copy-notification ${isVisible ? 'visible' : 'hidden'}`}
  >
    <div className="sk-panel">
      <div className="sk-font-small sk-bold">Copied value to clipboard.</div>
    </div>
  </div>
);

CopyNotification.propTypes =  {
  isVisible: PropTypes.bool.isRequired,
};

export default CopyNotification;
