import { AppState } from "@/ui_models/app_state";
import { observer } from "mobx-react-lite";
import { toDirective } from "./utils";
import { Icon } from "./Icon";

type Props = {
  appState: AppState;
}

const NoteTags = observer(({ appState }: Props) => {
  return (
    <div className="flex mt-2">
      {appState.notes.activeNoteTags.map(tag => (
        <span className="bg-contrast rounded text-sm color-text p-1 flex items-center mr-2">
          <Icon type="hashtag" className="small color-neutral mr-1" />
          {tag.title}
        </span>
      ))}
    </div>
  );
});

export const NoteTagsDirective = toDirective<Props>(NoteTags);