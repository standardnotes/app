export const IconComponent = ({
  children,
  size = 20,
}: {
  children: React.ReactNode;
  size?: number;
}) => {
  return <p style={{width: size, height: size}}>{children}</p>;
};
