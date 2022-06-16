import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const animationName = (token) => `countdown${token}`;

const rotaAnimation = (token, offset) => `@keyframes rota_${animationName(
  token
)} {
  0% {
    transform: rotate(${offset}deg);
  }

  100% {
    transform: rotate(360deg);
  }
}`;

const opaAnimation = (token, offset) => `@keyframes opa_${animationName(
  token
)} {
  0% {
    opacity: 1;
  }

  ${offset}%,
  100% {
    opacity: 0;
  }
}`;

const opaReverseAnimation = (
  token,
  offset
) => `@keyframes opa_r_${animationName(token)} {
  0% {
    opacity: 0;
  }

  ${offset}%,
  100% {
    opacity: 1;
  }
}`;

function calculateOpaOffset(timeLeft, total) {
  const percentage = calculatePercentage(timeLeft, total) * 100;
  const percTo50 = 50 - percentage;
  // 8 is an offset because the animation is not in sync otherwise
  return percTo50 < 0 ? 0 : Math.ceil(Math.min(percTo50 + 8, 50));
}

function calculateRotaOffset(timeLeft, total) {
  return calculatePercentage(timeLeft, total) * 360;
}

function calculatePercentage(timeLeft, total) {
  return (total - timeLeft) / total;
}

function useRotateAnimation(token, timeLeft, total) {
  useEffect(
    function createRotateAnimation() {
      const style = document.createElement('style');
      document.head.appendChild(style);
      const styleSheet = style.sheet;

      const rotaKeyframes = rotaAnimation(
        token,
        calculateRotaOffset(timeLeft, total)
      );
      const opaKeyframes = opaAnimation(token, calculateOpaOffset(timeLeft, total));
      const opaReverseKeyframes = opaReverseAnimation(
        token,
        calculateOpaOffset(timeLeft, total)
      );

      styleSheet.insertRule(rotaKeyframes, styleSheet.cssRules.length);
      styleSheet.insertRule(opaKeyframes, styleSheet.cssRules.length);
      styleSheet.insertRule(opaReverseKeyframes, styleSheet.cssRules.length);

      function cleanup() {
        style.remove();
      }

      const timer = setTimeout(cleanup, timeLeft * 1000);

      return () => {
        clearTimeout(timer);
        cleanup();
      };
    },
    [token, timeLeft, total]
  );
}

const CountdownPie = ({ token, timeLeft, total, bgColor, fgColor }) => {
  useRotateAnimation(token, timeLeft, total);

  return (
    <div className="countdown-pie" style={{
      backgroundColor: bgColor
    }}>
      <div
        className="pie spinner"
        style={{
          animation: `rota_${animationName(token)} ${timeLeft}s linear`,
          backgroundColor: fgColor
        }}
      />
      <div className="pie background" style={{
        backgroundColor: fgColor
      }} />
      <div
        className="pie filler"
        style={{
          animation: `opa_r_${animationName(token)} ${timeLeft}s steps(1, end)`,
          backgroundColor: fgColor
        }}
      />
      <div
        className="mask"
        style={{
          animation: `opa_${animationName(token)} ${timeLeft}s steps(1, end)`,
        }}
      />
    </div>
  );
};

CountdownPie.propTypes = {
  token: PropTypes.string.isRequired,
  timeLeft: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  bgColor: PropTypes.string,
  fgColor: PropTypes.string
};

export default CountdownPie;
