import { type ReactNode } from 'react'
import { Drawer as VaulDrawer } from 'vaul'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={(o) => !o && onClose()} shouldScaleBackground>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40" />
        <VaulDrawer.Content className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 outline-none">
          <div className="bg-white rounded-t-3xl pb-10 max-h-[90dvh] overflow-y-auto">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Заголовок */}
            {title && (
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">{title}</h2>
              </div>
            )}

            {/* Контент */}
            <div className="px-5 pt-4">
              {children}
            </div>
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  )
}
