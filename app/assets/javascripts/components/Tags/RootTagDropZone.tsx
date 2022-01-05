import { Icon } from '@/components/Icon';
import { usePremiumModal } from '@/components/Premium';
import {
  FeaturesState,
  TAG_FOLDERS_FEATURE_NAME,
} from '@/ui_models/app_state/features_state';
import { TagsState } from '@/ui_models/app_state/tags_state';
import { observer } from 'mobx-react-lite';
import { useDrop } from 'react-dnd';
import { DropItem, DropProps, ItemTypes } from './dragndrop';

type Props = {
  tagsState: TagsState;
  featuresState: FeaturesState;
};

export const RootTagDropZone: React.FC<Props> = observer(
  ({ tagsState, featuresState }) => {
    const premiumModal = usePremiumModal();
    const isNativeFoldersEnabled = featuresState.enableNativeFoldersFeature;
    const hasFolders = featuresState.hasFolders;

    const [{ isOver, canDrop }, dropRef] = useDrop<DropItem, void, DropProps>(
      () => ({
        accept: ItemTypes.TAG,
        canDrop: () => {
          return true;
        },
        drop: (item) => {
          if (!hasFolders) {
            premiumModal.activate(TAG_FOLDERS_FEATURE_NAME);
            return;
          }

          tagsState.assignParent(item.uuid, undefined);
        },
        collect: (monitor) => ({
          isOver: !!monitor.isOver(),
          canDrop: !!monitor.canDrop(),
        }),
      }),
      [tagsState, hasFolders, premiumModal]
    );

    if (!isNativeFoldersEnabled || !hasFolders) {
      return null;
    }

    return (
      <div
        ref={dropRef}
        className={`root-drop ${canDrop ? 'active' : ''} ${
          isOver ? 'is-over' : ''
        }`}
      >
        <Icon className="color-neutral" type="link-off" />
        <p className="content">
          Move the tag here to <br />
          remove it from its folder.
        </p>
      </div>
    );
  }
);
