import { ApplicationGroup } from '@/ui_models/application_group';
import { ApplicationDescriptor, User } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../Icon';

type Props = {
  mainApplicationGroup: ApplicationGroup;
};

type AccountDescriptor = ApplicationDescriptor & {
  user: User | undefined;
};

export const AccountSwitcherMenu: FunctionComponent<Props> = ({
  mainApplicationGroup,
}) => {
  const [accountDescriptors, setAccountDescriptors] = useState<
    AccountDescriptor[]
  >([]);

  useEffect(() => {
    const removeAppGroupObserver =
      mainApplicationGroup.addApplicationChangeObserver(() => {
        const applications = mainApplicationGroup.getApplications();
        const applicationDescriptors = mainApplicationGroup.getDescriptors();
        const accountDescriptors: AccountDescriptor[] =
          applicationDescriptors.map((descriptor) => {
            const user = applications
              .find(
                (application) =>
                  descriptor.identifier === application.identifier
              )
              ?.getUser();
            return {
              ...descriptor,
              user,
            };
          });
        setAccountDescriptors(accountDescriptors);
      });

    return () => {
      removeAppGroupObserver();
    };
  }, [mainApplicationGroup]);

  return (
    <>
      {accountDescriptors.map((descriptor) => (
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
          {descriptor.user?.email ? descriptor.user.email : descriptor.label}
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
