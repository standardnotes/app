import React from 'react';
import ReactDOM from 'react-dom';

export function makeAngularComponent(component, name, bindings) {
  const propKeys = Object.keys(bindings);
  return {
    name,
    options: {
      bindings,
      controller: ["$element", ($el) => {
        const element = $el[0];
        return {
          $onChanges() {
            // Make a clean props object instead of just passing `this` to the component
            // (reduces the amount of noise in the debugger)
            const props = {};
            for (const key of propKeys) {
              props[key] = this[key];
            }
            ReactDOM.render(React.createElement(component, props), element);
          },
          $onDestroy() {
            ReactDOM.unmountComponentAtNode(element);
          }
        };
      }]
    }
  };
}
