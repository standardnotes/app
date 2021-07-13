import { FunctionalComponent } from 'preact';

const HorizontalLine: FunctionalComponent<{ index: number; length: number }> =
  ({ index, length }) =>
    index < length - 1 ? (
      <hr className="h-1px w-full bg-border no-border" />
    ) : null;

export const PreferencesSegment: FunctionalComponent = ({ children }) => (
  <div className="flex flex-col">{children}</div>
);

export const PreferencesGroup: FunctionalComponent = ({ children }) => (
  <div className="bg-default border-1 border-solid rounded border-gray-300 px-6 py-6 flex flex-col gap-2">
    {!Array.isArray(children)
      ? children
      : children.map((c, i, arr) => (
          <>
            {c}
            <HorizontalLine index={i} length={arr.length} />
          </>
        ))}
  </div>
);

export const PreferencesPane: FunctionalComponent = ({ children }) => (
  <div className="preferences-pane flex-grow flex flex-row overflow-y-auto min-h-0">
    <div className="flex-grow flex flex-col py-6 items-center">
      <div className="w-125 max-w-125 flex flex-col gap-3">{children}</div>
    </div>
    <div className="flex-basis-55 flex-shrink-max" />
  </div>
);
