import { Icon } from '@/components/Icon';
import { Menu } from '@/components/menu/Menu';
import { MenuItem, MenuItemType } from '@/components/menu/MenuItem';
import { usePremiumModal } from '@/components/Premium';
import { WebApplication } from '@/ui_models/application';
import { FeatureStatus, SNComponent } from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { EditorMenuItem, EditorMenuGroup } from '../ChangeEditorOption';
import { PLAIN_EDITOR_NAME } from './createEditorMenuGroups';

type ChangeEditorMenuProps = {
  application: WebApplication;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
  groups: EditorMenuGroup[];
  isOpen: boolean;
  selectComponent: (component: SNComponent | null) => Promise<void>;
  currentEditor: SNComponent | undefined;
};

const getGroupId = (group: EditorMenuGroup) =>
  group.title.toLowerCase().replace(/\s/, '-');

export const ChangeEditorMenu: FunctionComponent<ChangeEditorMenuProps> = ({
  application,
  closeOnBlur,
  groups,
  isOpen,
  selectComponent,
  currentEditor,
}) => {
  const premiumModal = usePremiumModal();

  const isEntitledToEditor = useCallback(
    (item: EditorMenuItem) => {
      const isPlainEditor = !item.component;

      if (item.isPremiumFeature) {
        return false;
      }

      if (isPlainEditor) {
        return true;
      }

      if (item.component) {
        return (
          application.getFeatureStatus(item.component.identifier) ===
          FeatureStatus.Entitled
        );
      }
    },
    [application]
  );

  const isSelectedEditor = useCallback(
    (item: EditorMenuItem) => {
      if (currentEditor) {
        if (item?.component?.identifier === currentEditor.identifier) {
          return true;
        }
      } else if (item.name === PLAIN_EDITOR_NAME) {
        return true;
      }
      return false;
    },
    [currentEditor]
  );

  const selectEditor = async (itemToBeSelected: EditorMenuItem) => {
    let shouldSelectEditor = true;

    if (itemToBeSelected.component) {
      const changeRequiresAlert =
        application.componentManager.doesEditorChangeRequireAlert(
          currentEditor,
          itemToBeSelected.component
        );

      if (changeRequiresAlert) {
        shouldSelectEditor =
          await application.componentManager.showEditorChangeAlert();
      }
    }

    if (
      itemToBeSelected.isPremiumFeature ||
      !isEntitledToEditor(itemToBeSelected)
    ) {
      premiumModal.activate(itemToBeSelected.name);
      shouldSelectEditor = false;
    }

    if (shouldSelectEditor) {
      selectComponent(itemToBeSelected.component ?? null);
    }
  };

  return (
    <Menu className="py-1" a11yLabel="Change editor menu" isOpen={isOpen}>
      {groups
        .filter((group) => group.items && group.items.length)
        .map((group, index) => {
          const groupId = getGroupId(group);

          return (
            <Fragment key={groupId}>
              <div
                className={`flex items-center px-2.5 py-2 text-xs font-semibold color-text border-0 border-y-1px border-solid border-main ${
                  index === 0 ? 'border-t-0 mb-2' : 'my-2'
                }`}
              >
                {group.icon && (
                  <Icon
                    type={group.icon}
                    className={`mr-2 ${group.iconClassName}`}
                  />
                )}
                <div className="font-semibold text-input">{group.title}</div>
              </div>
              {group.items.map((item) => {
                const onClickEditorItem = () => {
                  selectEditor(item);
                };

                return (
                  <MenuItem
                    type={MenuItemType.RadioButton}
                    onClick={onClickEditorItem}
                    className={`sn-dropdown-item py-2 text-input focus:bg-info-backdrop focus:shadow-none`}
                    onBlur={closeOnBlur}
                    checked={isSelectedEditor(item)}
                  >
                    <div className="flex flex-grow items-center justify-between">
                      {item.name}
                      {(item.isPremiumFeature || !isEntitledToEditor(item)) && (
                        <Icon type="premium-feature" />
                      )}
                    </div>
                  </MenuItem>
                );
              })}
            </Fragment>
          );
        })}
    </Menu>
  );
};
