import {
  PreferencesGroup,
  PreferencesPane,
  PreferencesSegment,
  Title,
  Subtitle,
  Text,
} from '../components';
import { observer } from 'mobx-react-lite';
import { WebApplication } from '@/ui_models/application';
import { ListedAccount } from '@standardnotes/snjs';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { ListedAccountItem } from './listed/BlogItem';
import { Button } from '@/components/Button';

type Props = {
  application: WebApplication;
};

export const Listed = observer(({ application }: Props) => {
  const [accounts, setAccounts] = useState<ListedAccount[]>([]);

  const reloadAccounts = useCallback(async () => {
    setAccounts(await application.getListedAccounts());
  }, [application]);

  useEffect(() => {
    reloadAccounts();
  }, [reloadAccounts]);

  const registerNewAccount = useCallback(() => {
    application.registerForNewListedAccount().then(() => {
      reloadAccounts();
    });
  }, [application, reloadAccounts]);

  return (
    <PreferencesPane>
      {accounts.length > 0 && (
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>
              Your {accounts.length === 1 ? 'Blog' : 'Blogs'} on Listed
            </Title>
            <div className="h-2 w-full" />
            {accounts.map((item, index, array) => {
              return (
                <ListedAccountItem
                  account={item}
                  showSeparator={index !== array.length - 1}
                  key={item.authorId}
                  application={application}
                />
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
        <PreferencesSegment>
          <Subtitle>Get Started</Subtitle>
          <Text>Create a free Listed author account to get started.</Text>
          <Button
            className="mt-3"
            type="normal"
            label={'Create New Author'}
            onClick={registerNewAccount}
          />
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  );
});
