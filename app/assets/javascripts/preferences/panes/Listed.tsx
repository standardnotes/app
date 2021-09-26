import {
  PreferencesGroup,
  PreferencesPane,
  PreferencesSegment,
  Title,
  Subtitle,
  Text,
  LinkButton,
} from '../components';
import { Button } from '@/components/Button';
import { observer } from 'mobx-react-lite';
import { WebApplication } from '@/ui_models/application';
import { Action, ContentType, SNComponent } from '@standardnotes/snjs';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { SNItem } from '@standardnotes/snjs/dist/@types/models/core/item';
import React, { useEffect, useState } from 'react';

type Props = {
  application: WebApplication;
};

const reloadItems = (
  application: WebApplication,
  setItems: React.Dispatch<React.SetStateAction<SNComponent[]>>
) => {
  setItems(application.getItems(ContentType.ActionsExtension) as SNComponent[]);
};

export const Listed = observer(({ application }: Props) => {
  //let items: SNComponent[] = [];
  const [items, setItems] = useState<SNComponent[]>([]);

  useEffect(() => {
    reloadItems(application, setItems);
  }, [application]);

  const disconnectListedBlog = (item: SNItem) => {
    application
      .deleteItem(item)
      .then(() => {
        reloadItems(application, setItems);
      })
      .catch((err) => console.error(err));
  };

  return (
    <PreferencesPane>
      {items.length > 0 && (
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>Your Blog(s) on Listed</Title>
            <div className="h-2 w-full" />
            {items.map((item: any, index, array) => {
              return (
                <React.Fragment key={item.uuid}>
                  <Subtitle>{item.name}</Subtitle>
                  <div className="flex">
                    <LinkButton
                      className="mr-2"
                      label="Open Blog"
                      link={
                        item.package_info.actions.find(
                          (action: Action) => action.label === 'Open Blog'
                        ).url
                      }
                    />
                    <LinkButton
                      className="mr-2"
                      label="Settings"
                      link={
                        item.package_info.actions.find(
                          (action: Action) => action.label === 'Settings'
                        ).url
                      }
                    />
                    <Button
                      type="danger"
                      label="Disconnect"
                      onClick={() => disconnectListedBlog(item)}
                    />
                  </div>
                  {index !== array.length - 1 && (
                    <HorizontalSeparator classes="mt-5 mb-3" />
                  )}
                </React.Fragment>
              );
            })}
          </PreferencesSegment>
        </PreferencesGroup>
      )}
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>About Listed</Title>
          <div className="h-2 w-full" />
          <Subtitle>What is Listed?</Subtitle>
          <Text>
            Listed is a free blogging platform that allows you to create a
            public journal published directly from your notes.{' '}
            <a
              target="_blank"
              href="https://listed.to"
              rel="noreferrer noopener"
            >
              Learn more
            </a>
          </Text>
        </PreferencesSegment>
        {!items && (
          <PreferencesSegment>
            <Subtitle>How to get started?</Subtitle>
            <Text>
              First, you’ll need to sign up for Listed. Once you have your
              Listed account, follow the instructions to connect it with your
              Standard Notes account.
            </Text>
            <LinkButton
              className="min-w-20 mt-3"
              link="https://listed.to"
              label="Get started"
            />
          </PreferencesSegment>
        )}
      </PreferencesGroup>
    </PreferencesPane>
  );
});
