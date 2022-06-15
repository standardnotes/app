import React from 'react';
import PropTypes from 'prop-types';
import jsQR from 'jsqr';
import { parseKeyUri } from '@Lib/otp';

const convertToGrayScale = (imageData) => {
  if (!imageData) {
    return;
  }

  for (let i = 0; i < imageData.data.length; i += 4) {
    const count = imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2];
    let color = 0;

    if (count > 510) {
      color = 255;
    } else if (count > 255) {
      color = 127.5;
    }

    imageData.data[i] = color;
    imageData.data[i + 1] = color;
    imageData.data[i + 2] = color;
    imageData.data[i + 3] = 255;
  }

  return imageData;
};

export default class QRCodeReader extends React.Component {
  onImageSelected = evt => {
    const file = evt.target.files[0];
    const url = URL.createObjectURL(file);
    const img = new Image();
    const self = this;

    img.onload = function() {
      URL.revokeObjectURL(this.src);

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = this.width;
      canvas.height = this.height;
      context.drawImage(this, 0, 0);

      let imageData = context.getImageData(0, 0, this.width, this.height);
      imageData = convertToGrayScale(imageData);

      const code = jsQR(imageData.data, imageData.width, imageData.height);

      const { onError, onSuccess } = self.props;

      if (code) {
        const otpData = parseKeyUri(code.data);
        if (otpData.type !== 'totp') {
          onError(`The '${otpData.type}' type is not supported.`);
        } else {
          onSuccess(otpData);
        }
      } else {
        onError('Error reading QR code from image. Please try again.');
      }
    };

    img.src = url;

    return false;
  };

  render() {
    return (
      <div className="qr-code-reader-container">
        <div className="sk-button info">
          <label className="no-style">
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={this.onImageSelected}
            />
            <div className="sk-label">Upload QR Code</div>
          </label>
        </div>
      </div>
    );
  }
}

QRCodeReader.propTypes = {
  onError: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};
