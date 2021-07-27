import { FunctionComponent } from 'preact';

export const CircleProgress: FunctionComponent<{
  percent: number;
  className?: string;
}> = ({ percent, className = '' }) => {
  const size = 16;
  const ratioStrokeRadius = 0.25;
  const outerRadius = size / 2;

  const radius = outerRadius * (1 - ratioStrokeRadius);
  const stroke = outerRadius - radius;

  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  const transition = `transition: 0.35s stroke-dashoffset;`;
  const transform = `transform: rotate(-90deg);`;
  const transformOrigin = `transform-origin: 50% 50%;`;
  const dasharray = `stroke-dasharray: ${circumference} ${circumference};`;
  const dashoffset = `stroke-dashoffset: ${offset};`;
  const style = `${transition} ${transform} ${transformOrigin} ${dasharray} ${dashoffset}`;
  return (
    <div className="h-5 w-5 min-w-5 min-h-5">
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle
          stroke="#086DD6"
          stroke-width={stroke}
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
          style={style}
        />
      </svg>
    </div>
  );
};
