import React from 'react';
import PropTypes from 'prop-types';
import AuthEntry from '@Components/AuthEntry';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const reorderEntries = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const ViewEntries = ({ entries, onEdit, onRemove, onCopyValue, canEdit, updateEntries, searchValue, lastUpdated }) => {
  const onDragEnd = (result) => {
    const droppedOutsideList = !result.destination;
    if (droppedOutsideList) {
      return;
    }

    const orderedEntries = reorderEntries(
      entries,
      result.source.index,
      result.destination.index
    );

    updateEntries(orderedEntries);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable" isDropDisabled={!canEdit}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="auth-list"
          >
            {entries.map((entry, index) => {
              /**
               * Filtering entries by account, service and notes properties.
               */
              const combinedString = `${entry.account}${entry.service}${entry.notes}`.toLowerCase();
              if (searchValue && !combinedString.includes(searchValue)) {
                return;
              }
              return (
                <Draggable
                  key={`${entry.service}-${index}`}
                  draggableId={`${entry.service}-${index}`}
                  index={index}
                  isDragDisabled={!canEdit}
                >
                  {(provided) => (
                    <AuthEntry
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      innerRef={provided.innerRef}
                      key={index}
                      id={index}
                      entry={entry}
                      onEdit={onEdit}
                      onRemove={onRemove}
                      onCopyValue={onCopyValue}
                      canEdit={canEdit}
                      lastUpdated={lastUpdated}
                    />
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

ViewEntries.propTypes =  {
  entries: PropTypes.arrayOf(PropTypes.object),
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onCopyValue: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired,
  lastUpdated: PropTypes.number.isRequired,
  updateEntries: PropTypes.func.isRequired,
  searchValue: PropTypes.string
};

export default ViewEntries;
