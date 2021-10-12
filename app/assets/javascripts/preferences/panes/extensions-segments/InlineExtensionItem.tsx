import { PreferencesGroup, PreferencesSegment } from "@/preferences/components";
import { FunctionComponent } from "preact";
import { ExtensionItem, ExtensionItemProps } from ".";

export const InlineExtensionItem: FunctionComponent<ExtensionItemProps> =
  (props) => {
    const { extension, application } = props;
    const url = application.componentManager.urlForComponent(extension) ?? undefined;

    return (
      <PreferencesGroup>
        <ExtensionItem {...props} />
        <PreferencesSegment>
          <iframe
            data-component-id={extension.uuid}
            frameBorder="0"
            sandbox="allow-scripts allow-top-navigation-by-user-activation allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-modals allow-forms allow-downloads"
            src={url}
          />
        </PreferencesSegment>
      </PreferencesGroup>
    );
  };
