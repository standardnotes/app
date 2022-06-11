import './CheckBoxElementsDefs.scss'

export const CheckBoxElementsDefs = () => {
  return (
    <svg viewBox="0 0 0 0" style={{ position: 'absolute', zIndex: -1, opacity: 0 }}>
      <defs>
        <path
          id="checkbox-square"
          d="M21 12.7v5c0 1.3-1 2.3-2.3 2.3H8.3C7 20 6 19 6 17.7V7.3C6 6 7 5 8.3 5h10.4C20 5 21 6 21 7.3v5.4"
        ></path>
        <path id="checkbox-mark" d="M10 13l2 2 5-5"></path>
        <circle id="checkbox-circle" cx="13.5" cy="12.5" r="10"></circle>
      </defs>
    </svg>
  )
}
