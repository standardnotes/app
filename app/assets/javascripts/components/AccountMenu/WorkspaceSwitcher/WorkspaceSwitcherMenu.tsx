import { ApplicationGroup } from '@/ui_models/application_group';
import { ApplicationDescriptor } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../../Icon';
import { Menu } from '../../Menu/Menu';
import { MenuItem, MenuItemSeparator, MenuItemType } from '../../Menu/MenuItem';
import { WorkspaceMenuItem } from './WorkspaceMenuItem';

type Props = {
  mainApplicationGroup: ApplicationGroup;
  isOpen: boolean;
};

export const WorkspaceSwitcherMenu: FunctionComponent<Props> = ({
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
      a11yLabel="Workspace switcher menu"
      className="px-0 focus:shadow-none"
      isOpen={isOpen}
    >
      {applicationDescriptors.map((descriptor) => (
        <WorkspaceMenuItem
          descriptor={descriptor}
          onClick={() => {
            mainApplicationGroup.loadApplicationForDescriptor(descriptor);
          }}
          renameDescriptor={(label: string) =>
            mainApplicationGroup.renameDescriptor(descriptor, label)
          }
        />
      ))}
      <MenuItemSeparator />
      <MenuItem
        type={MenuItemType.IconButton}
        onClick={() => {
          mainApplicationGroup.addNewApplication();
        }}
      >
        <Icon type="user-add" className="color-neutral mr-2" />
        Add another workspace
      </MenuItem>
    </Menu>
  );
};
