import { WebApplication } from '@/ui_models/application';
import { SNTheme } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { JSXInternal } from 'preact/src/jsx';
import { Switch } from '../Switch';

type Props = {
  theme: SNTheme;
  application: WebApplication;
  onBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

export const ThemesMenuButton: FunctionComponent<Props> = ({
  application,
  theme,
  onBlur,
}) => {
  const toggleTheme: JSXInternal.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    if (theme.isLayerable() || !theme.active) {
      application.toggleComponent(theme);
    }
  };

  return (
    <button
      className={`sn-dropdown-item focus:bg-info-backdrop focus:shadow-none ${
        theme.isLayerable() ? `justify-start` : `justify-between`
      }`}
      onClick={toggleTheme}
      onBlur={onBlur}
    >
      {theme.isLayerable() ? (
        <>
          <Switch className="px-0 mr-2" checked={theme.active} />
          {theme.package_info.name}
        </>
      ) : (
        <>
          <div className="flex items-center">
            <div
              className={`pseudo-radio-btn ${
                theme.active ? 'pseudo-radio-btn--checked' : ''
              } mr-2`}
            ></div>
            <span className={theme.active ? 'font-semibold' : undefined}>
              {theme.package_info.name}
            </span>
          </div>
          <div
            className="w-5 h-5 rounded-full"
            style={{
              backgroundColor: theme.package_info?.dock_icon?.background_color,
            }}
          ></div>
        </>
      )}
    </button>
  );
};
