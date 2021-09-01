import { FunctionalComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { CircleProgress } from './CircleProgress';

/**
 * Circular progress bar which runs in a specified time interval
 * @param time - time interval in ms
 */
export const CircleProgressTime: FunctionalComponent<{ time: number }> = ({
  time,
}) => {
  const [percent, setPercent] = useState(0);
  const interval = time / 100;
  useEffect(() => {
    const tick = setInterval(() => {
      if (percent === 100) {
        setPercent(0);
      } else {
        setPercent(percent + 1);
      }
    }, interval);
    return () => {
      clearInterval(tick);
    };
  });
  return <CircleProgress percent={percent} />;
};
