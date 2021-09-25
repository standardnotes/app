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
import { ContentType } from '@standardnotes/snjs';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { SNItem } from '@standardnotes/snjs/dist/@types/models/core/item';

type Props = {
  application: WebApplication;
};

export const Listed = observer(({ application }: Props) => {
  const items = application.getItems(ContentType.ActionsExtension);

  const addNewBlog = () => {
    fetch('https://listed.to/authors', {
      method: 'POST',
    })
      .then((res) => res.text())
      .then((res) => {
        if (res) {
          console.log(res);
        }
      })
      .catch((err) => console.error(err));
  };

  const disconnectListedBlog = (item: SNItem) => {
    application.deleteItem(item);
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
                <>
                  <Subtitle>{item.name}</Subtitle>
                  <div className="flex">
                    <LinkButton
                      className="mt-0 mr-2"
                      label="Open Blog"
                      link={
                        item.package_info.actions.find(
                          (action: any) => action.label === 'Open Blog'
                        ).url
                      }
                    />
                    <LinkButton
                      className="mt-0 mr-2"
                      label="Settings"
                      link={
                        item.package_info.actions.find(
                          (action: any) => action.label === 'Settings'
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
                </>
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
            <a target="_blank" href="#">
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
            <Button
              className="min-w-20 mt-3"
              type="normal"
              label="Get started"
              onClick={addNewBlog}
            />
          </PreferencesSegment>
        )}
      </PreferencesGroup>
    </PreferencesPane>
  );
});
