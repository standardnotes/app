import { FunctionalComponent } from 'preact';

interface IProps {
  componentName: string;
}

export const UrlMissing: FunctionalComponent<IProps> = ({ componentName }) => {
  return (
    <div className={'sn-component'}>
      <div className={'sk-panel static'}>
        <div className={'sk-panel-content'}>
          <div className={'sk-panel-section stretch'}>
            <div className={'sk-panel-section-title'}>
              This extension is not installed correctly.
            </div>
            <p>Please uninstall {componentName}, then re-install it.</p>
            <p>
              This issue can occur if you access Standard Notes using an older version of the app.{' '}
              Ensure you are running at least version 2.1 on all platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
