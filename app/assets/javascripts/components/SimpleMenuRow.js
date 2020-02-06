import React from 'react';
import { makeAngularComponent } from './utils';

function SimpleMenuRow({
  action,
  label,
  subtitle,
  desc,
  circle,
  circleAlign,
  faded,
  disabled,
  stylekitClass
}) {
  return (
    <div onClick={action} className="sk-menu-panel-row row" title={desc}>
      <div className="sk-menu-panel-column">
        <div className="left">
          {circle && (!circleAlign || circleAlign === 'left') && (
            <div className="sk-menu-panel-column">
              <div className={`sk-circle small ${circle}`} />
            </div>
          )}

          <div
            className={`sk-menu-panel-column ${
              disabled || faded ? 'faded' : ''
            }`}
          >
            <div className={`sk-label ${stylekitClass ? stylekitClass : ''}`}>
              {label}
            </div>
            {subtitle && <div className="sk-sublabel">{subtitle}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ngSimpleMenuRow = makeAngularComponent(
  SimpleMenuRow,
  'simpleMenuRow',
  {
    action: '&',
    label: '=',
    subtitle: '=',
    desc: '=',
    circle: '<',
    circleAlign: '=',
    faded: '=',
    disabled: '=',
    stylekitClass: '='
  }
);
