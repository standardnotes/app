import {
  PanelResizerProps,
  PanelResizerState,
} from '@/ui_models/panel_resizer';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

export const PanelResizer: FunctionComponent<PanelResizerProps> = observer(
  ({
    alwaysVisible,
    application,
    defaultWidth,
    hoverable,
    collapsable,
    minWidth,
    panel,
    prefKey,
    resizeFinishCallback,
    side,
    widthEventCallback,
  }) => {
    const [panelResizerState] = useState(
      () =>
        new PanelResizerState({
          alwaysVisible,
          application,
          defaultWidth,
          hoverable,
          collapsable,
          minWidth,
          panel,
          prefKey,
          resizeFinishCallback,
          side,
          widthEventCallback,
        })
    );
    const panelResizerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (panelResizerRef.current) {
        panelResizerState.setMinWidth(panelResizerRef.current.offsetWidth + 2);
      }
    }, [panelResizerState]);

    return (
      <div
        className={`panel-resizer ${panelResizerState.side} ${
          panelResizerState.hoverable ? 'hoverable' : ''
        } ${panelResizerState.alwaysVisible ? 'alwaysVisible' : ''} ${
          panelResizerState.pressed ? 'dragging' : ''
        } ${panelResizerState.collapsed ? 'collapsed' : ''}`}
        onMouseDown={panelResizerState.onMouseDown}
        onDblClick={panelResizerState.onDblClick}
        ref={panelResizerRef}
      ></div>
    );
  }
);
