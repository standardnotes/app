import { ApplicationGroup } from '@/ui_models/application_group';
import { ApplicationDescriptor } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../Icon';

type Props = {
  mainApplicationGroup: ApplicationGroup;
};

export const AccountSwitcherMenu: FunctionComponent<Props> = ({
  mainApplicationGroup,
}) => {
  const [applicationDescriptors, setApplicationDescriptors] = useState<
    ApplicationDescriptor[]
  >([]);

  useEffect(() => {
    const removeAppGroupObserver =
      mainApplicationGroup.addApplicationChangeObserver(() => {
        const applicationDescriptors = mainApplicationGroup.getDescriptors();
        setApplicationDescriptors(applicationDescriptors);
      });

    return () => {
      removeAppGroupObserver();
    };
  }, [mainApplicationGroup]);

  return (
    <menu aria-label="Account switcher menu" className="px-0 focus:shadow-none">
      {applicationDescriptors.map((descriptor) => (
        <button
          className="sn-dropdown-item py-2 focus:bg-info-backdrop focus:shadow-none"
          onClick={() => {
            mainApplicationGroup.loadApplicationForDescriptor(descriptor);
          }}
        >
          <div
            className={`pseudo-radio-btn ${
              descriptor.primary ? 'pseudo-radio-btn--checked' : ''
            } mr-2`}
          ></div>
          {descriptor.label}
        </button>
      ))}
      <div className="h-1px my-2 bg-border"></div>
      <button
        className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none"
        onClick={() => {
          mainApplicationGroup.addNewApplication();
        }}
      >
        <Icon type="user-add" className="color-neutral mr-2" />
        Add another account
      </button>
    </menu>
  );
};
