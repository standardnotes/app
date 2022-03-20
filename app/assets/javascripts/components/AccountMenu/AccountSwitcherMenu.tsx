import { WebApplication } from '@/ui_models/application';
import { ApplicationGroup } from '@/ui_models/application_group';
import { ApplicationDescriptor } from '@standardnotes/snjs/dist/@types';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { Icon } from '../Icon';

type Props = {
  mainApplicationGroup: ApplicationGroup;
};

export const AccountSwitcherMenu: FunctionComponent<Props> = ({
  mainApplicationGroup,
}) => {
  const [descriptors, setDescriptors] = useState<ApplicationDescriptor[]>(() =>
    mainApplicationGroup.getDescriptors()
  );
  const [activeApplication, setActiveApplication] = useState(
    () => mainApplicationGroup.primaryApplication as WebApplication
  );

  const reloadDescriptors = useCallback(() => {
    setDescriptors(mainApplicationGroup.getDescriptors());
  }, [mainApplicationGroup]);

  useEffect(() => {
    const removeAppGroupObserver =
      mainApplicationGroup.addApplicationChangeObserver(() => {
        setActiveApplication(
          mainApplicationGroup.primaryApplication as WebApplication
        );
        reloadDescriptors();
      });

    return () => {
      removeAppGroupObserver();
    };
  }, [mainApplicationGroup, reloadDescriptors]);

  return (
    <>
      {descriptors.map((descriptor) => (
        <button
          className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none"
          onClick={() => {
            mainApplicationGroup.loadApplicationForDescriptor(descriptor);
          }}
        >
          <div
            className={`pseudo-radio-btn ${
              descriptor.identifier === activeApplication.identifier
                ? 'pseudo-radio-btn--checked'
                : ''
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
    </>
  );
};
