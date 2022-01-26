import { Icon } from '@/components/Icon';
import { usePremiumModal } from '@/components/Premium';
import { KeyboardKey } from '@/services/ioService';
import { WebApplication } from '@/ui_models/application';
import { SNComponent } from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { EditorMenuItem, EditorMenuGroup } from '../ChangeEditorOption';
import { PLAIN_EDITOR_NAME } from './createEditorMenuGroups';

type EditorAccordionMenuProps = {
  application: WebApplication;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
  groups: EditorMenuGroup[];
  isOpen: boolean;
  selectComponent: (component: SNComponent | null) => Promise<void>;
  selectedEditor: SNComponent | undefined;
};

const getGroupId = (group: EditorMenuGroup) =>
  group.title.toLowerCase().replace(/\s/, '-');

const getGroupBtnId = (groupId: string) => groupId + '-button';

export const EditorAccordionMenu: FunctionComponent<
  EditorAccordionMenuProps
> = ({
  application,
  closeOnBlur,
  groups,
  isOpen,
  selectComponent,
  selectedEditor,
}) => {
  const [activeGroupId, setActiveGroupId] = useState('');
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>();
  const premiumModal = usePremiumModal();

  const isSelectedEditor = useCallback(
    (item: EditorMenuItem) => {
      if (selectedEditor) {
        if (item?.component?.identifier === selectedEditor.identifier) {
          return true;
        }
      } else if (item.name === PLAIN_EDITOR_NAME) {
        return true;
      }
      return false;
    },
    [selectedEditor]
  );

  useEffect(() => {
    const activeGroup = groups.find((group) => {
      return group.items.some(isSelectedEditor);
    });

    if (activeGroup) {
      const newActiveGroupId = getGroupId(activeGroup);
      setActiveGroupId(newActiveGroupId);
    }
  }, [groups, selectedEditor, isSelectedEditor]);

  useEffect(() => {
    if (
      typeof focusedItemIndex === 'undefined' &&
      activeGroupId.length &&
      menuItemRefs.current.length
    ) {
      const activeGroupIndex = menuItemRefs.current.findIndex(
        (item) => item?.id === getGroupBtnId(activeGroupId)
      );
      setFocusedItemIndex(activeGroupIndex);
    }
  }, [activeGroupId, focusedItemIndex]);

  useEffect(() => {
    if (
      typeof focusedItemIndex === 'number' &&
      focusedItemIndex > -1 &&
      isOpen
    ) {
      const focusedItem = menuItemRefs.current[focusedItemIndex];
      const containingGroupId = focusedItem?.closest(
        '[data-accordion-group]'
      )?.id;
      if (
        !focusedItem?.id &&
        containingGroupId &&
        containingGroupId !== activeGroupId
      ) {
        setActiveGroupId(containingGroupId);
      }
      focusedItem?.focus();
    }
  }, [activeGroupId, focusedItemIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case KeyboardKey.Up: {
          if (
            typeof focusedItemIndex === 'number' &&
            menuItemRefs.current.length
          ) {
            let previousItemIndex = focusedItemIndex - 1;
            if (previousItemIndex < 0) {
              previousItemIndex = menuItemRefs.current.length - 1;
            }
            setFocusedItemIndex(previousItemIndex);
          }
          e.preventDefault();
          break;
        }
        case KeyboardKey.Down: {
          if (
            typeof focusedItemIndex === 'number' &&
            menuItemRefs.current.length
          ) {
            let nextItemIndex = focusedItemIndex + 1;
            if (nextItemIndex > menuItemRefs.current.length - 1) {
              nextItemIndex = 0;
            }
            setFocusedItemIndex(nextItemIndex);
          }
          e.preventDefault();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusedItemIndex, groups]);

  const selectEditor = (item: EditorMenuItem) => {
    if (item.component) {
      if (
        !item.component.package_info.interchangeable ||
        !selectedEditor?.package_info.interchangeable
      ) {
        application.alertService
          .confirm(
            'Doing so might result in minor formatting changes.',
            'Are you sure you want to change the editor?',
            'Yes, change it'
          )
          .then((shouldChange) => {
            if (shouldChange && item.component) {
              selectComponent(item.component);
            }
          });
      } else {
        selectComponent(item.component);
      }
    } else if (item.isPremiumFeature) {
      premiumModal.activate(item.name);
    } else {
      selectComponent(null);
    }
  };

  return (
    <>
      {groups.map((group) => {
        const groupId = getGroupId(group);
        const buttonId = getGroupBtnId(groupId);
        const contentId = `${groupId}-content`;

        if (!group.items || !group.items.length) {
          return null;
        }

        return (
          <Fragment key={groupId}>
            <div id={groupId} data-accordion-group>
              <h3 className="m-0">
                <button
                  aria-controls={contentId}
                  aria-expanded={activeGroupId === groupId}
                  className="sn-dropdown-item focus:bg-info-backdrop justify-between py-2.5"
                  id={buttonId}
                  type="button"
                  onClick={() => {
                    if (activeGroupId !== groupId) {
                      setActiveGroupId(groupId);
                    } else {
                      setActiveGroupId('');
                    }
                  }}
                  onBlur={closeOnBlur}
                  ref={(button) => {
                    if (!menuItemRefs.current?.includes(button) && button) {
                      menuItemRefs.current.push(button);
                    }
                  }}
                >
                  <div className="flex items-center">
                    {group.icon && (
                      <Icon
                        type={group.icon}
                        className={`mr-2 ${group.iconClassName}`}
                      />
                    )}
                    <div className="font-semibold text-input">
                      {group.title}
                    </div>
                  </div>
                  <Icon
                    type="chevron-down"
                    className={`sn-dropdown-arrow color-grey-1 ${
                      activeGroupId === groupId && 'sn-dropdown-arrow-flipped'
                    }`}
                  />
                </button>
              </h3>
              <div
                id={contentId}
                aria-labelledby={buttonId}
                className={activeGroupId !== groupId ? 'hidden' : ''}
              >
                <div role="radiogroup">
                  {group.items.map((item) => {
                    return (
                      <button
                        role="radio"
                        onClick={() => {
                          selectEditor(item);
                        }}
                        className={`sn-dropdown-item py-2 text-input focus:bg-info-backdrop focus:shadow-none ${
                          item.isPremiumFeature && 'justify-between'
                        }`}
                        aria-checked={false}
                        onBlur={closeOnBlur}
                        ref={(button) => {
                          if (
                            !menuItemRefs.current?.includes(button) &&
                            button
                          ) {
                            menuItemRefs.current.push(button);
                          }
                        }}
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
                        {item.isPremiumFeature && (
                          <Icon type="premium-feature" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="min-h-1px my-1 bg-border hide-if-last-child"></div>
          </Fragment>
        );
      })}
    </>
  );
};
