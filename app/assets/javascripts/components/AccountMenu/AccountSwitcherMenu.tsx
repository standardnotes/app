import { ApplicationGroup } from '@/ui_models/application_group';
import { ApplicationDescriptor } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../Icon';
import { Menu } from '../Menu/Menu';
import { MenuItem, MenuItemSeparator, MenuItemType } from '../Menu/MenuItem';

type Props = {
  mainApplicationGroup: ApplicationGroup;
  isOpen: boolean;
};

export const AccountSwitcherMenu: FunctionComponent<Props> = ({
  mainApplicationGroup,
  isOpen,
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
    <Menu
      a11yLabel="Account switcher menu"
      className="px-0 focus:shadow-none"
      isOpen={isOpen}
    >
      {applicationDescriptors.map((descriptor) => (
        <MenuItem
          type={MenuItemType.RadioButton}
          className="sn-dropdown-item py-2 focus:bg-info-backdrop focus:shadow-none"
          onClick={() => {
            mainApplicationGroup.loadApplicationForDescriptor(descriptor);
          }}
          checked={descriptor.primary}
        >
          {descriptor.label}
        </MenuItem>
      ))}
      <MenuItemSeparator />
      <MenuItem
        type={MenuItemType.IconButton}
        onClick={() => {
          mainApplicationGroup.addNewApplication();
        }}
      >
        <Icon type="user-add" className="color-neutral mr-2" />
        Add another account
      </MenuItem>
    </Menu>
  );
};
