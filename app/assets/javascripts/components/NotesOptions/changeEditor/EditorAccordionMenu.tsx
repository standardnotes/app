import { Icon } from '@/components/Icon';
import { Menu } from '@/components/menu/Menu';
import { MenuItem, MenuItemType } from '@/components/menu/MenuItem';
import { usePremiumModal } from '@/components/Premium';
import { WebApplication } from '@/ui_models/application';
import { SNComponent } from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { EditorMenuItem, EditorMenuGroup } from '../ChangeEditorOption';
import { PLAIN_EDITOR_NAME } from './createEditorMenuGroups';

type EditorAccordionMenuProps = {
  application: WebApplication;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
  groups: EditorMenuGroup[];
  isOpen: boolean;
  selectComponent: (component: SNComponent | null) => Promise<void>;
  currentEditor: SNComponent | undefined;
};

const getGroupId = (group: EditorMenuGroup) =>
  group.title.toLowerCase().replace(/\s/, '-');

export const EditorAccordionMenu: FunctionComponent<
  EditorAccordionMenuProps
> = ({
  application,
  closeOnBlur,
  groups,
  isOpen,
  selectComponent,
  currentEditor,
}) => {
  const premiumModal = usePremiumModal();

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

    if (itemToBeSelected.isPremiumFeature) {
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
        .map((group) => {
          const groupId = getGroupId(group);

          return (
            <Fragment key={groupId}>
              <div className="flex items-center px-3 my-2 text-xs font-semibold color-text">
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
                    className={`sn-dropdown-item py-2 text-input focus:bg-info-backdrop focus:shadow-none ${
                      item.isPremiumFeature && 'justify-between'
                    }`}
                    onBlur={closeOnBlur}
                  >
                    <div className="flex items-center">
                      <div
                        className={`pseudo-radio-btn ${
                          isSelectedEditor(item)
                            ? 'pseudo-radio-btn--checked'
                            : ''
                        } ml-0.5 mr-2`}
                      ></div>
                      {item.name}
                    </div>
                    {item.isPremiumFeature && <Icon type="premium-feature" />}
                  </MenuItem>
                );
              })}
            </Fragment>
          );
        })}
    </Menu>
  );
};
