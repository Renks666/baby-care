import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'

interface ActionButtonsProps {
  onEdit?: () => void
  onDelete?: () => void
  editColor?: string
  deleteColor?: string
}

export function ActionButtons({
  onEdit,
  onDelete,
  editColor = 'hover:text-pink-400',
  deleteColor = 'hover:text-red-400',
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {onEdit && (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onEdit}
          className={`text-gray-300 dark:text-gray-600 ${editColor} transition-colors p-1`}
        >
          <Pencil size={15} />
        </motion.button>
      )}
      {onDelete && (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onDelete}
          className={`text-gray-300 dark:text-gray-600 ${deleteColor} transition-colors p-1`}
        >
          <Trash2 size={15} />
        </motion.button>
      )}
    </div>
  )
}
