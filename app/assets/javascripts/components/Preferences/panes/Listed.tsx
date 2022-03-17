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
import { ButtonType, ListedAccount } from '@standardnotes/snjs';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { ListedAccountItem } from './listed/BlogItem';
import { Button } from '@/components/Button';

type Props = {
  application: WebApplication;
};

export const Listed = observer(({ application }: Props) => {
  const [accounts, setAccounts] = useState<ListedAccount[]>([]);
  const [requestingAccount, setRequestingAccount] = useState<boolean>();

  const reloadAccounts = useCallback(async () => {
    setAccounts(await application.getListedAccounts());
  }, [application]);

  useEffect(() => {
    reloadAccounts();
  }, [reloadAccounts]);

  const registerNewAccount = useCallback(() => {
    setRequestingAccount(true);

    const requestAccount = async () => {
      const account = await application.requestNewListedAccount();
      if (account) {
        const openSettings = await application.alertService.confirm(
          `Your new Listed blog has been successfully created!` +
            ` You can publish a new post to your blog from Standard Notes via the` +
            ` <i>Actions</i> menu in the editor pane. Open your blog settings to begin setting it up.`,
          undefined,
          'Open Settings',
          ButtonType.Info,
          'Later'
        );
        reloadAccounts();
        if (openSettings) {
          const info = await application.getListedAccountInfo(account);
          if (info) {
            application.deviceInterface.openUrl(info?.settings_url);
          }
        }
      }
      setRequestingAccount(false);
    };

    requestAccount();
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
            disabled={requestingAccount}
            label={
              requestingAccount ? 'Creating account...' : 'Create New Author'
            }
            onClick={registerNewAccount}
          />
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  );
});
