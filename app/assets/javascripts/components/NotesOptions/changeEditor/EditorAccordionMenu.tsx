import { Icon } from '@/components/Icon';
import { SNComponent } from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { EditorLike, EditorMenuGroup } from '../ChangeEditorOption';
import { PLAIN_EDITOR_NAME } from './createEditorMenuGroups';

type EditorAccordionMenuProps = {
  groups: EditorMenuGroup[];
  selectedEditor: SNComponent | undefined;
  selectComponent: (component: SNComponent | null) => Promise<void>;
};

const idForGroup = (group: EditorMenuGroup) =>
  group.title.toLowerCase().replace(/\s/, '-');

export const EditorAccordionMenu: FunctionComponent<
  EditorAccordionMenuProps
> = ({ groups, selectedEditor, selectComponent }) => {
  const [activeGroupId, setActiveGroupId] = useState('');

  const isSelectedEditor = useCallback(
    (item: EditorLike) => {
      if (selectedEditor) {
        if (item.identifier === selectedEditor.identifier) {
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
      if (group.items.find(isSelectedEditor)) {
        return true;
      }
      return false;
    });

    if (activeGroup) {
      setActiveGroupId(idForGroup(activeGroup));
    }
  }, [groups, selectedEditor, isSelectedEditor]);

  return (
    <>
      {groups.map((group) => {
        const groupId = idForGroup(group);
        const buttonId = `${groupId}-button`;
        const contentId = `${groupId}-content`;

        if (!group.items || !group.items.length) {
          return null;
        }

        return (
          <Fragment key={groupId}>
            <h3 className="m-0">
              <button
                aria-controls={contentId}
                aria-expanded={activeGroupId === groupId}
                className="sn-dropdown-item justify-between py-2"
                id={buttonId}
                type="button"
                onClick={() => {
                  if (activeGroupId !== groupId) {
                    setActiveGroupId(groupId);
                  } else {
                    setActiveGroupId('');
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
                  <div className="font-semibold text-input">{group.title}</div>
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
                        if ((item as SNComponent).uuid) {
                          selectComponent(item as SNComponent);
                        } else {
                          selectComponent(null);
                        }
                      }}
                      className={`sn-dropdown-item text-input focus:bg-info-backdrop focus:shadow-none`}
                      aria-checked={false}
                    >
                      <div
                        className={`pseudo-radio-btn ${
                          isSelectedEditor(item)
                            ? 'pseudo-radio-btn--checked'
                            : ''
                        } ml-0.5 mr-2`}
                      ></div>
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="min-h-1px my-1 bg-border hide-if-last-child"></div>
          </Fragment>
        );
      })}
    </>
  );
};
