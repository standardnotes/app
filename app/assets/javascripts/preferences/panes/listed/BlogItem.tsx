import { Button } from '@/components/Button';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { LinkButton, Subtitle } from '@/preferences/components';
import { WebApplication } from '@/ui_models/application';
import {
  Action,
  SNActionsExtension,
  SNComponent,
  SNItem,
} from '@standardnotes/snjs/dist/@types';
import { FunctionalComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';

type Props = {
  item: SNComponent;
  showSeparator: boolean;
  disabled: boolean;
  disconnect: (item: SNItem) => void;
  application: WebApplication;
};

export const BlogItem: FunctionalComponent<Props> = ({
  item,
  showSeparator,
  disabled,
  disconnect,
  application,
}) => {
  const [actions, setActions] = useState<Action[] | undefined>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const loadActions = async () => {
      setIsLoadingActions(true);
      application.actionsManager
        .loadExtensionInContextOfItem(item as SNActionsExtension, item)
        .then((extension) => {
          setActions(extension?.actions);
        })
        .catch((err) => application.alertService.alert(err))
        .finally(() => {
          setIsLoadingActions(false);
        });
    };
    if (!actions || actions.length === 0) loadActions();
  }, [application.actionsManager, application.alertService, item, actions]);

  const handleDisconnect = () => {
    setIsDisconnecting(true);
    application.alertService
      .confirm(
        'Disconnecting will result in loss of access to your blog. Ensure your Listed author key is backed up before uninstalling.',
        `Disconnect blog "${item?.name}"?`,
        'Disconnect',
        1
      )
      .then((shouldDisconnect) => {
        if (shouldDisconnect) {
          disconnect(item as SNItem);
        } else {
          setIsDisconnecting(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setIsDisconnecting(false);
        application.alertService.alert(err);
      });
  };

  return (
    <>
      <Subtitle>{item?.name}</Subtitle>
      <div className="flex">
        {isLoadingActions ? (
          <div className="sk-spinner small info"></div>
        ) : null}
        {actions && actions?.length > 0 ? (
          <>
            <LinkButton
              className="mr-2"
              label="Open Blog"
              link={
                actions?.find((action: Action) => action.label === 'Open Blog')
                  ?.url || ''
              }
            />
            <LinkButton
              className="mr-2"
              label="Settings"
              link={
                actions?.find((action: Action) => action.label === 'Settings')
                  ?.url || ''
              }
            />
            <Button
              type="danger"
              label={isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              disabled={disabled}
              onClick={handleDisconnect}
            />
          </>
        ) : null}
      </div>
      {showSeparator && <HorizontalSeparator classes="mt-5 mb-3" />}
    </>
  );
};
