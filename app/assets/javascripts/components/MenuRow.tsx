import { Component } from 'preact';

export type MenuRowProps = {
  action?: () => void;
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
  subRows?: MenuRowProps[];
  subtitle?: string;
};

type Props = MenuRowProps;

export class MenuRow extends Component<Props> {
  onClick = ($event: Event) => {
    if (this.props.disabled || !this.props.action) {
      return;
    }

    $event.stopPropagation();

    this.props.action();
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
