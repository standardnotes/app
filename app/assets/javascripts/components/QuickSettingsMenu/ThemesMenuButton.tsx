import { WebApplication } from '@/ui_models/application';
import { FeatureStatus } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { Icon } from '../Icon';
import { usePremiumModal } from '../Premium';
import { Switch } from '../Switch';
import { ThemeItem } from './QuickSettingsMenu';

type Props = {
  item: ThemeItem;
  application: WebApplication;
  onBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

export const ThemesMenuButton: FunctionComponent<Props> = ({
  application,
  item,
  onBlur,
}) => {
  const premiumModal = usePremiumModal();

  const isThirdPartyTheme = useMemo(
    () => application.isThirdPartyFeature(item.identifier),
    [application, item.identifier]
  );
  const isEntitledToTheme = useMemo(
    () =>
      application.getFeatureStatus(item.identifier) === FeatureStatus.Entitled,
    [application, item.identifier]
  );
  const canActivateTheme = useMemo(
    () => isEntitledToTheme || isThirdPartyTheme,
    [isEntitledToTheme, isThirdPartyTheme]
  );

  const toggleTheme: JSXInternal.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();

    if (item.component && canActivateTheme) {
      const themeIsLayerableOrNotActive =
        item.component.isLayerable() || !item.component.active;

      if (themeIsLayerableOrNotActive) {
        application.toggleTheme(item.component);
      }
    } else {
      premiumModal.activate(`${item.name} theme`);
    }
  };

  return (
    <button
      className={`sn-dropdown-item focus:bg-info-backdrop focus:shadow-none justify-between`}
      onClick={toggleTheme}
      onBlur={onBlur}
    >
      {item.component?.isLayerable() ? (
        <>
          <div className="flex items-center">
            <Switch className="px-0 mr-2" checked={item.component?.active} />
            {item.name}
          </div>
          {!canActivateTheme && <Icon type="premium-feature" />}
        </>
      ) : (
        <>
          <div className="flex items-center">
            <div
              className={`pseudo-radio-btn ${
                item.component?.active ? 'pseudo-radio-btn--checked' : ''
              } mr-2`}
            ></div>
            <span
              className={item.component?.active ? 'font-semibold' : undefined}
            >
              {item.name}
            </span>
          </div>
          {item.component && canActivateTheme ? (
            <div
              className="w-5 h-5 rounded-full"
              style={{
                backgroundColor:
                  item.component.package_info?.dock_icon?.background_color,
              }}
            ></div>
          ) : (
            <Icon type="premium-feature" />
          )}
        </>
      )}
    </button>
  );
};
