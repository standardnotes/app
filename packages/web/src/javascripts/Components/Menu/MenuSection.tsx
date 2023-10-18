import { ReactNode } from 'react'

const MenuSection = ({ title, children }: { title?: string; children: ReactNode }) => {
  return (
    <div className="my-4 md:my-2 md:border-b md:border-border md:pb-2 md:translucent-ui:border-[--popover-border-color]">
      {title && <div className="px-3 py-1 text-sm font-semibold uppercase text-text lg:text-xs">{title}</div>}
      <div className="divide-y divide-passive-3 rounded bg-passive-4 md:divide-none md:bg-transparent">{children}</div>
    </div>
  )
}

export default MenuSection
