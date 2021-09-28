import { FunctionalComponent } from "preact";
import { Text } from '@/preferences/components';
import { Button } from '@/components/Button';
import { AppState } from "@/ui_models/app_state";
import { observer } from "mobx-react-lite";

type Props = {
  appState: AppState;
};

export const NoSubscription: FunctionalComponent<Props> = observer(({ appState }) => (
  <>
    <Text>You don't have a Standard Notes subscription yet.</Text>
    <div className="flex">
      <Button
        className="min-w-20 mt-3 mr-3"
        type="normal"
        label="Refresh"
        onClick={() => null}
      />
      <Button
        className="min-w-20 mt-3"
        type="primary"
        label="Purchase subscription"
        onClick={() => appState.preferences.openPurchaseIframe()}
      />
    </div>
  </>
));
