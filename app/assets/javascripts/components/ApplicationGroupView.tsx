import { ApplicationGroup } from '@/ui_models/application_group';
import { WebApplication } from '@/ui_models/application';
import { Component } from 'preact';
import { ApplicationView } from './ApplicationView';

type State = {
  applicationGroup: ApplicationGroup;
  applications: WebApplication[];
  activeApplication?: WebApplication;
};

type Props = {
  mainApplicationGroup: ApplicationGroup;
};

export class ApplicationGroupView extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      applicationGroup: props.mainApplicationGroup,
      applications: [],
    };
    props.mainApplicationGroup.addApplicationChangeObserver(() => {
      this.setState({
        activeApplication: this.state.applicationGroup
          .primaryApplication as WebApplication,
        applications:
          this.state.applicationGroup.getApplications() as WebApplication[],
      });
    });
    props.mainApplicationGroup.initialize();
  }

  render() {
    return (
      <>
        {this.state.applications.map((application) => {
          if (application === this.state.activeApplication) {
            return (
              <div id={application.identifier}>
                <ApplicationView
                  mainApplicationGroup={this.props.mainApplicationGroup}
                  application={application}
                />
              </div>
            );
          }
        })}
      </>
    );
  }
}
