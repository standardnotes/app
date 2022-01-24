import { Icon } from '@/components/Icon';
import { usePremiumModal } from '@/components/Premium';
import { WebApplication } from '@/ui_models/application';
import { SNComponent } from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { EditorMenuItem, EditorMenuGroup } from '../ChangeEditorOption';
import { PLAIN_EDITOR_NAME } from './createEditorMenuGroups';

type EditorAccordionMenuProps = {
  application: WebApplication;
  groups: EditorMenuGroup[];
  selectedEditor: SNComponent | undefined;
  selectComponent: (component: SNComponent | null) => Promise<void>;
};

const idForGroup = (group: EditorMenuGroup) =>
  group.title.toLowerCase().replace(/\s/, '-');

export const EditorAccordionMenu: FunctionComponent<
  EditorAccordionMenuProps
> = ({ application, groups, selectedEditor, selectComponent }) => {
  const [activeGroupId, setActiveGroupId] = useState('');
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
                        if (item.component) {
                          if (
                            selectedEditor?.package_info.note_type !==
                            item.component.package_info.note_type
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
                      }}
                      className={`sn-dropdown-item text-input focus:bg-info-backdrop focus:shadow-none ${
                        item.isPremiumFeature && 'justify-between'
                      }`}
                      aria-checked={false}
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
