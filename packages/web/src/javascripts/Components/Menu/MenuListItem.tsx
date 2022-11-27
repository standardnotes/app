import { ReactNode } from 'react'

const MenuListItem = ({ children }: { children: ReactNode }) => {
  return (
    <li className="list-none" role="none">
      {children}
    </li>
  )
}

export default MenuListItem
