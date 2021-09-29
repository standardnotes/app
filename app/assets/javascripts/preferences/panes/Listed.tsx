import {
  PreferencesGroup,
  PreferencesPane,
  PreferencesSegment,
  Title,
  Subtitle,
  Text,
  LinkButton,
} from '../components';
import { observer } from 'mobx-react-lite';
import { WebApplication } from '@/ui_models/application';
import { ContentType, SNComponent } from '@standardnotes/snjs';
import { SNItem } from '@standardnotes/snjs/dist/@types/models/core/item';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { BlogItem } from './listed/BlogItem';

type Props = {
  application: WebApplication;
};

export const Listed = observer(({ application }: Props) => {
  const [items, setItems] = useState<SNComponent[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const reloadItems = useCallback(() => {
    const components = application
      .getItems(ContentType.ActionsExtension)
      .filter(
        (item) => (item as SNComponent).package_info?.name === 'Listed'
      ) as SNComponent[];
    setItems(components);
  }, [application]);

  useEffect(() => {
    reloadItems();
  }, [reloadItems]);

  const disconnectListedBlog = (item: SNItem) => {
    return new Promise((resolve, reject) => {
      setIsDeleting(true);
      application
        .deleteItem(item)
        .then(() => {
          reloadItems();
          setIsDeleting(false);
          resolve(true);
        })
        .catch((err) => {
          application.alertService.alert(err);
          setIsDeleting(false);
          console.error(err);
          reject(err);
        });
    });
  };

  return (
    <PreferencesPane>
      {items.length > 0 && (
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>
              Your {items.length === 1 ? 'Blog' : 'Blogs'} on Listed
            </Title>
            <div className="h-2 w-full" />
            {items.map((item, index, array) => {
              return (
                <BlogItem
                  item={item}
                  showSeparator={index !== array.length - 1}
                  disabled={isDeleting}
                  disconnect={disconnectListedBlog}
                  key={item.uuid}
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
        {items.length === 0 ? (
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
        ) : null}
      </PreferencesGroup>
    </PreferencesPane>
  );
});
