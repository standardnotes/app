import { FunctionalComponent } from 'preact';

export const Title: FunctionalComponent = ({ children }) => (
  <h2 className="text-base m-0 mb-1">{children}</h2>
);

export const Subtitle: FunctionalComponent = ({ children }) => (
  <h4 className="font-medium text-sm m-0 mb-1">{children}</h4>
);

export const Text: FunctionalComponent = ({ children }) => (
  <p className="text-xs">{children}</p>
);

export const Button: FunctionalComponent<{ label: string; link: string }> = ({
  label,
  link,
}) => (
  <a
    target="_blank"
    className="block bg-default color-text rounded border-solid border-1 
    border-gray-300 px-4 py-2 font-bold text-sm fit-content mt-3
    focus:bg-contrast hover:bg-contrast "
    href={link}
  >
    {label}
  </a>
);
