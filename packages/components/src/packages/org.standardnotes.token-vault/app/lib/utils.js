const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const secretPattern = `^[${base32chars}]{16,}$`;

export function hexToBytes(hex) {
  var bytes = [];
  for (var c = 0, C = hex.length; c < C; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

export function decToHex(s) {
  return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
}

export function bufToHex(buf) {
  return Array.prototype.map
    .call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2))
    .join('');
}

export function hextoBuf(hex) {
  var view = new Uint8Array(hex.length / 2);

  for (var i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }

  return view.buffer;
}

export function base32ToHex(base32) {
  var bits, chunk, hex, i, val;
  bits = '';
  hex = '';
  i = 0;
  while (i < base32.length) {
    val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    bits += leftpad(val.toString(2), 5, '0');
    i++;
  }
  i = 0;
  while (i + 4 <= bits.length) {
    chunk = bits.substr(i, 4);
    hex = hex + parseInt(chunk, 2).toString(16);
    i += 4;
  }
  return hex;
}

export function leftpad(str, len, pad) {
  if (len + 1 >= str.length) {
    str = Array(len + 1 - str.length).join(pad) + str;
  }
  return str;
}

/**
 * This function takes an otpauth:// style key URI and parses it into an object with keys for the
 * various parts of the URI
 *
 * @param {String} uri The otpauth:// uri that you want to parse
 *
 * @return {Object} The parsed URI or null on failure. The URI object looks like this:
 *
 * {
 *  type: 'totp',
 *  label: { issuer: 'ACME Co', account: 'jane@example.com' },
 *  query: {
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   digits: '6'
 *  }
 * }
 *
 * @see <a href="https://github.com/google/google-authenticator/wiki/Key-Uri-Format">otpauth Key URI Format</a>
 */
export function parseKeyUri(uri) {
  // Quick sanity check
  if (typeof uri !== 'string' || uri.length < 7) return null;

  // I would like to just use new URL(), but the behavior is different between node and browsers, so
  // we have to do some of the work manually with regex.
  const parts = /otpauth:\/\/([A-Za-z]+)\/([^?]+)\??(.*)?/i.exec(uri);

  if (!parts || parts.length < 3) {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  const [fullUri, type, fullLabel] = parts;

  // Sanity check type and label
  if (!type || !fullLabel) {
    return null;
  }

  // Parse the label
  const decodedLabel = decodeURIComponent(fullLabel);

  const labelParts = decodedLabel.split(/: ?/);

  const label =
    labelParts && labelParts.length === 2
      ? { issuer: labelParts[0], account: labelParts[1] }
      : { issuer: '', account: decodedLabel };

  // Parse query string
  const qs = parts[3] ? new URLSearchParams(parts[3]) : [];

  const query = [...qs].reduce((acc, [key, value]) => {
    acc[key] = value;

    return acc;
  }, {});

  // Returned the parsed parts of the URI
  return { type: type.toLowerCase(), label, query };
}

/**
 * Converts a hex color string to an object containing RGB values.
 */
export function hexColorToRGB(hexColor) {
  // Expand the shorthand form (e.g. "0AB") to full form (e.g. "00AABB")
  const shortHandFormRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hexColor = hexColor.replace(shortHandFormRegex, function(m, red, green, blue) {
    return red + red + green + green + blue + blue;
  });
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
  return result ? {
    red: parseInt(result[1], 16),
    green: parseInt(result[2], 16),
    blue: parseInt(result[3], 16)
  } : null;
}

export const defaultBgColor = '#FFF';

/**
 * Gets the color variable to be used based on the calculated constrast of a color.
 */
export function getVarColorForContrast(backgroundColor) {
  const styleKitColors = {
    foreground: '--sn-stylekit-contrast-foreground-color',
    background: '--sn-stylekit-contrast-background-color'
  };
  if (!backgroundColor) {
    return styleKitColors.foreground;
  }
  const colorContrast = Math.round(((parseInt(backgroundColor.red) * 299) + (parseInt(backgroundColor.green) * 587) + (parseInt(backgroundColor.blue) * 114)) / 1000);
  return (colorContrast > 70) ? styleKitColors.background : styleKitColors.foreground;
}

function getPropertyValue(document, propertyName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(propertyName).trim().toUpperCase();
}

export const contextualColors = [
  'info',
  'success',
  'neutral',
  'warning'
];

export function getContextualColor(document, colorName) {
  if (!contextualColors.includes(colorName)) {
    return;
  }

  return getPropertyValue(
    document,
    `--sn-stylekit-${colorName}-color`
  );
}

export function getEntryColor(document, entry) {
  const { color } = entry;

  if (!contextualColors.includes(color)) {
    return color;
  }

  return getContextualColor(document, color);
}

export function getAllContextualColors(document) {
  return contextualColors.map((colorName) => getContextualColor(document, colorName));
}
