import { FunctionComponent } from 'react'

const MenuItemSeparator: FunctionComponent = () => (
  <li className="list-none" role="none">
    <div role="separator" className="my-2 h-[1px] bg-[--separator-color]" />
  </li>
)

export default MenuItemSeparator
