import { Component } from 'preact';

type RowProps = {
  action?: (...args: any[]) => void;
  actionArgs?: any[];
  buttonAction?: () => void;
  buttonClass?: string;
  buttonText?: string;
  desc?: string;
  disabled?: boolean;
  circle?: string;
  circleAlign?: string;
  faded?: boolean;
  hasButton?: boolean;
  label: string;
  spinnerClass?: string;
  stylekitClass?: string;
  subRows?: RowProps[];
  subtitle?: string;
};

export const React2AngularMenuRowPropsArray = [
  'action',
  'actionArgs',
  'buttonAction',
  'buttonClass',
  'buttonText',
  'desc',
  'disabled',
  'circle',
  'circleAlign',
  'faded',
  'hasButton',
  'label',
  'spinnerClass',
  'stylekitClass',
  'subRows',
  'subtitle',
];

type Props = RowProps;

export class MenuRow extends Component<Props> {
  onClick = ($event: Event) => {
    if (this.props.disabled || !this.props.action) {
      return;
    }
    $event.stopPropagation();

    if (this.props.actionArgs) {
      this.props.action(...this.props.actionArgs);
    } else {
      this.props.action();
    }
  };

  clickAccessoryButton = ($event: Event) => {
    if (this.props.disabled) {
      return;
    }
    $event.stopPropagation();
    this.props.buttonAction?.();
  };

  render() {
    return (
      <div
        title={this.props.desc}
        onClick={this.onClick}
        className="sk-menu-panel-row row"
      >
        <div className="sk-menu-panel-column">
          <div className="left">
            {this.props.circle &&
              (!this.props.circleAlign || this.props.circleAlign == 'left') && (
                <div className="sk-menu-panel-column">
                  <div className={this.props.circle + ' sk-circle small'} />
                </div>
              )}

            <div
              className={
                (this.props.faded || this.props.disabled ? 'faded' : '') +
                ' sk-menu-panel-column'
              }
            >
              <div className={this.props.stylekitClass + ' sk-label'}>
                {this.props.label}
              </div>
              {this.props.subtitle && (
                <div className="sk-sublabel">{this.props.subtitle}</div>
              )}
              {this.props.children}
            </div>
          </div>

          {this.props.subRows && this.props.subRows.length > 0 && (
            <div className="sk-menu-panel-subrows">
              {this.props.subRows.map((row) => {
                return (
                  <MenuRow
                    action={row.action}
                    actionArgs={row.actionArgs}
                    label={row.label}
                    spinnerClass={row.spinnerClass}
                    subtitle={row.subtitle}
                  />
                );
              })}
            </div>
          )}
        </div>

        {this.props.circle && this.props.circleAlign == 'right' && (
          <div className="sk-menu-panel-column">
            <div className={this.props.circle + ' sk-circle small'} />
          </div>
        )}

        {this.props.hasButton && (
          <div className="sk-menu-panel-column">
            <button
              className={this.props.buttonClass + ' sn-button small'}
              onClick={this.props.buttonAction!}
            >
              {this.props.buttonText}
            </button>
          </div>
        )}

        {this.props.spinnerClass && (
          <div className="sk-menu-panel-column">
            <div className={this.props.spinnerClass + ' sk-spinner small'} />
          </div>
        )}
      </div>
    );
  }
}
