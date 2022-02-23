import { WebApplication } from '@/ui_models/application';
import {
  calculateSubmenuStyle,
  SubmenuStyle,
} from '@/utils/calculateSubmenuStyle';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { Action, ListedAccount, SNNote } from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../Icon';

type Props = {
  application: WebApplication;
  note: SNNote;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

type ListedMenuGroup = {
  name: string;
  account: ListedAccount;
  actions: Action[];
};

type ListedMenuItemProps = {
  action: Action;
  note: SNNote;
  group: ListedMenuGroup;
  application: WebApplication;
  reloadMenuGroup: (group: ListedMenuGroup) => Promise<void>;
};

const ListedMenuItem: FunctionComponent<ListedMenuItemProps> = ({
  action,
  note,
  application,
  group,
  reloadMenuGroup,
}) => {
  const [isRunning, setIsRunning] = useState(false);

  const handleClick = async () => {
    if (isRunning) {
      return;
    }

    setIsRunning(true);

    await application.actionsManager.runAction(action, note);

    setIsRunning(false);

    reloadMenuGroup(group);
  };

  return (
    <button
      key={action.url}
      onClick={handleClick}
      className="sn-dropdown-item flex justify-between py-2 text-input focus:bg-info-backdrop focus:shadow-none"
    >
      <div className="flex flex-col">
        <div className="font-semibold">{action.label}</div>
        {action.access_type && (
          <div className="text-xs mt-0.5 color-grey-0">
            {'Uses '}
            <strong>{action.access_type}</strong>
            {' access to this note.'}
          </div>
        )}
      </div>
      {isRunning && <div className="sk-spinner spinner-info w-3 h-3" />}
    </button>
  );
};

type ListedActionsMenuProps = {
  application: WebApplication;
  note: SNNote;
  recalculateMenuStyle: () => void;
};

const ListedActionsMenu: FunctionComponent<ListedActionsMenuProps> = ({
  application,
  note,
  recalculateMenuStyle,
}) => {
  const [menuGroups, setMenuGroups] = useState<ListedMenuGroup[]>([]);
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(true);

  const reloadMenuGroup = async (group: ListedMenuGroup) => {
    const updatedAccountInfo = await application.getListedAccountInfo(
      group.account,
      note.uuid
    );

    if (!updatedAccountInfo) {
      return;
    }

    const updatedGroup: ListedMenuGroup = {
      name: updatedAccountInfo.display_name,
      account: group.account,
      actions: updatedAccountInfo.actions,
    };

    const updatedGroups = menuGroups.map((group) => {
      if (updatedGroup.account.authorId === group.account.authorId) {
        return updatedGroup;
      } else {
        return group;
      }
    });

    setMenuGroups(updatedGroups);
  };

  useEffect(() => {
    const fetchListedAccounts = async () => {
      if (!application.hasAccount()) {
        setIsFetchingAccounts(false);
        return;
      }

      try {
        const listedAccountEntries = await application.getListedAccounts();

        if (!listedAccountEntries.length) {
          throw new Error('No Listed accounts found');
        }

        const menuGroups: ListedMenuGroup[] = [];

        await Promise.all(
          listedAccountEntries.map(async (account) => {
            const accountInfo = await application.getListedAccountInfo(
              account,
              note.uuid
            );

            if (accountInfo) {
              menuGroups.push({
                name: accountInfo.display_name,
                account,
                actions: accountInfo.actions,
              });
            } else {
              menuGroups.push({
                name: account.authorId,
                account,
                actions: [],
              });
            }
          })
        );

        setMenuGroups(menuGroups);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingAccounts(false);
        setTimeout(() => {
          recalculateMenuStyle();
        });
      }
    };

    fetchListedAccounts();
  }, [application, note.uuid, recalculateMenuStyle]);

  return (
    <>
      {isFetchingAccounts && (
        <div className="w-full flex items-center justify-center p-4">
          <div className="sk-spinner w-5 h-5 spinner-info" />
        </div>
      )}
      {!isFetchingAccounts && menuGroups.length ? (
        <>
          {menuGroups.map((group, index) => (
            <Fragment key={group.account.authorId}>
              <div
                className={`w-full px-2.5 py-2 text-input font-semibold color-text border-0 border-y-1px border-solid border-main ${
                  index === 0 ? 'border-t-0 mb-1' : 'my-1'
                }`}
              >
                {group.name}
              </div>
              {group.actions.length ? (
                group.actions.map((action) => (
                  <ListedMenuItem
                    action={action}
                    note={note}
                    key={action.url}
                    group={group}
                    application={application}
                    reloadMenuGroup={reloadMenuGroup}
                  />
                ))
              ) : (
                <div className="px-3 py-2 color-grey-0 select-none">
                  No actions available
                </div>
              )}
            </Fragment>
          ))}
        </>
      ) : null}
      {!isFetchingAccounts && !menuGroups.length ? (
        <div className="w-full flex items-center justify-center px-4 py-6">
          <div className="color-grey-0 select-none">
            No Listed accounts found
          </div>
        </div>
      ) : null}
    </>
  );
};

export const ListedActionsOption: FunctionComponent<Props> = ({
  application,
  note,
  closeOnBlur,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  });

  const toggleListedMenu = () => {
    if (!isMenuOpen) {
      const menuPosition = calculateSubmenuStyle(menuButtonRef.current);
      if (menuPosition) {
        setMenuStyle(menuPosition);
      }
    }

    setIsMenuOpen(!isMenuOpen);
  };

  const recalculateMenuStyle = useCallback(() => {
    const newMenuPosition = calculateSubmenuStyle(
      menuButtonRef.current,
      menuRef.current
    );

    if (newMenuPosition) {
      setMenuStyle(newMenuPosition);
    }
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      setTimeout(() => {
        recalculateMenuStyle();
      });
    }
  }, [isMenuOpen, recalculateMenuStyle]);

  return (
    <Disclosure open={isMenuOpen} onChange={toggleListedMenu}>
      <DisclosureButton
        ref={menuButtonRef}
        onBlur={closeOnBlur}
        className="sn-dropdown-item justify-between"
      >
        <div className="flex items-center">
          <Icon type="listed" className="color-neutral mr-2" />
          Listed actions
        </div>
        <Icon type="chevron-right" className="color-neutral" />
      </DisclosureButton>
      <DisclosurePanel
        ref={menuRef}
        style={{
          ...menuStyle,
          position: 'fixed',
        }}
        className="sn-dropdown flex flex-col max-h-120 min-w-68 pb-1 fixed overflow-y-auto"
      >
        {isMenuOpen && (
          <ListedActionsMenu
            application={application}
            note={note}
            recalculateMenuStyle={recalculateMenuStyle}
          />
        )}
      </DisclosurePanel>
    </Disclosure>
  );
};
