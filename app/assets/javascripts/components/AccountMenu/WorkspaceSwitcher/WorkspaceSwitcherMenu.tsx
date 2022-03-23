import { ApplicationGroup } from '@/ui_models/application_group';
import { AppState } from '@/ui_models/app_state';
import { ApplicationDescriptor } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../../Icon';
import { Menu } from '../../Menu/Menu';
import { MenuItem, MenuItemSeparator, MenuItemType } from '../../Menu/MenuItem';
import { WorkspaceMenuItem } from './WorkspaceMenuItem';

type Props = {
  mainApplicationGroup: ApplicationGroup;
  appState: AppState;
  isOpen: boolean;
};

export const WorkspaceSwitcherMenu: FunctionComponent<Props> = observer(
  ({ mainApplicationGroup, appState, isOpen }) => {
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
            onDelete={() => {
              appState.accountMenu.setSigningOut(true);
            }}
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
  }
);
