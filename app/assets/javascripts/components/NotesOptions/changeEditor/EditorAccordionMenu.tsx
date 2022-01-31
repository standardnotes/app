import { Icon } from '@/components/Icon';
import { usePremiumModal } from '@/components/Premium';
import { KeyboardKey } from '@/services/ioService';
import { WebApplication } from '@/ui_models/application';
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/views/constants';
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

const isElementHidden = (element: Element) => !element.clientHeight;

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
      isOpen &&
      !menuItemRefs.current.some((btn) => btn === document.activeElement)
    ) {
      const selectedEditor = groups
        .map((group) => group.items)
        .flat()
        .find((item) => isSelectedEditor(item));

      if (selectedEditor) {
        const editorButton = menuItemRefs.current.find(
          (btn) => btn?.dataset.itemName === selectedEditor.name
        );
        editorButton?.focus();
      }
    }
  }, [groups, isOpen, isSelectedEditor]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === KeyboardKey.Down || e.key === KeyboardKey.Up) {
      e.preventDefault();
    } else {
      return;
    }

    let items = menuItemRefs.current;

    if (!activeGroupId) {
      items = items.filter((btn) => btn?.id);
    }

    const currentItemIndex =
      items.findIndex((btn) => btn === document.activeElement) ?? 0;

    if (e.key === KeyboardKey.Up) {
      let previousItemIndex = currentItemIndex - 1;
      if (previousItemIndex < 0) {
        previousItemIndex = items.length - 1;
      }
      const previousItem = items[previousItemIndex];
      if (previousItem) {
        if (isElementHidden(previousItem)) {
          const previousItemGroupId = previousItem.closest(
            '[data-accordion-group]'
          )?.id;
          if (previousItemGroupId) {
            setActiveGroupId(previousItemGroupId);
          }
          setTimeout(() => {
            previousItem.focus();
          }, 10);
        }

        previousItem.focus();
      }
    }

    if (e.key === KeyboardKey.Down) {
      let nextItemIndex = currentItemIndex + 1;
      if (nextItemIndex > items.length - 1) {
        nextItemIndex = 0;
      }
      const nextItem = items[nextItemIndex];
      if (nextItem) {
        if (isElementHidden(nextItem)) {
          const nextItemGroupId = nextItem.closest(
            '[data-accordion-group]'
          )?.id;
          if (nextItemGroupId) {
            setActiveGroupId(nextItemGroupId);
          }
          setTimeout(() => {
            nextItem.focus();
          }, 10);
        }

        nextItem?.focus();
      }
    }
  };

  const selectEditor = (item: EditorMenuItem) => {
    if (item.component) {
      selectComponent(item.component);
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
            <div
              id={groupId}
              data-accordion-group
              tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
              onKeyDown={handleKeyDown}
            >
              <h3 className="m-0">
                <button
                  aria-controls={contentId}
                  aria-expanded={activeGroupId === groupId}
                  className="sn-dropdown-item focus:bg-info-backdrop justify-between py-3"
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
                        data-item-name={item.name}
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
            <div className="min-h-1px bg-border hide-if-last-child"></div>
          </Fragment>
        );
      })}
    </>
  );
};
