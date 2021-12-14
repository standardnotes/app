import { FunctionalComponent } from 'preact';

interface IProps {
  componentName: string;
  reloadIframe: () => void;
}

export const IssueOnLoading: FunctionalComponent<IProps> = ({
  componentName,
  reloadIframe,
}) => {
  return (
    <div className={'sn-component'}>
      <div className={'sk-app-bar no-edges no-top-edge dynamic-height'}>
        <div className={'left'}>
          <div className={'sk-app-bar-item'}>
            <div className={'sk-label.warning'}>
              There was an issue loading {componentName}.
            </div>
          </div>
        </div>
        <div className={'right'}>
          <div className={'sk-app-bar-item'} onClick={reloadIframe}>
            <button className={'sn-button small info'}>Reload</button>
          </div>
        </div>
      </div>
    </div>
  );
};
