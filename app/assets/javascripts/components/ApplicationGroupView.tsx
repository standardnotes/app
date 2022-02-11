import { ApplicationGroup } from '@/ui_models/application_group';
import { WebApplication } from '@/ui_models/application';
import { Component } from 'preact';
import { ApplicationView } from './ApplicationView';

type State = {
  activeApplication?: WebApplication;
};

type Props = {
  mainApplicationGroup: ApplicationGroup;
};

export class ApplicationGroupView extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    props.mainApplicationGroup.addApplicationChangeObserver(() => {
      const activeApplication = props.mainApplicationGroup
        .primaryApplication as WebApplication;
      this.setState({ activeApplication });
    });

    props.mainApplicationGroup.initialize();
  }

  render() {
    return (
      <>
        {this.state.activeApplication && (
          <div id={this.state.activeApplication.identifier}>
            <ApplicationView
              key={this.state.activeApplication.ephemeralIdentifier}
              mainApplicationGroup={this.props.mainApplicationGroup}
              application={this.state.activeApplication}
            />
          </div>
        )}
      </>
    );
  }
}
