import { Button } from '@/components/Button';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { LinkButton, Subtitle } from '@/preferences/components';
import { WebApplication } from '@/ui_models/application';
import { Action, SNComponent, SNItem } from '@standardnotes/snjs/dist/@types';
import { JSXInternal } from 'preact/src/jsx';
import React, { useState } from 'react';

type Props = {
  item: SNComponent;
  showSeparator: boolean;
  disabled: boolean;
  disconnect: (item: SNItem) => void;
  application: WebApplication;
};

export const BlogItem = ({
  item,
  showSeparator,
  disabled,
  disconnect,
  application,
}: Props): JSXInternal.Element => {
  const applicationAlertService = application.alertService;

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = () => {
    setIsDisconnecting(true);
    applicationAlertService
      .confirm(
        'Disconnecting will result in loss of access to your blog. Ensure your Listed author key is backed up before uninstalling.',
        `Disconnect blog "${item.name}"?`,
        'Disconnect',
        1
      )
      .then((shouldDisconnect) => {
        if (shouldDisconnect) {
          disconnect(item);
        } else {
          setIsDisconnecting(false);
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <React.Fragment>
      <Subtitle>{item.name}</Subtitle>
      <div className="flex">
        <LinkButton
          className="mr-2"
          label="Open Blog"
          link={
            (item as any).package_info.actions.find(
              (action: Action) => action.label === 'Open Blog'
            ).url
          }
        />
        <LinkButton
          className="mr-2"
          label="Settings"
          link={
            (item as any).package_info.actions.find(
              (action: Action) => action.label === 'Settings'
            ).url
          }
        />
        <Button
          type="danger"
          label={isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          disabled={disabled}
          onClick={handleDisconnect}
        />
      </div>
      {showSeparator && <HorizontalSeparator classes="mt-5 mb-3" />}
    </React.Fragment>
  );
};
