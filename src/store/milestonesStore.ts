import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

export type MilestoneCategory = 'motor' | 'social' | 'speech' | 'cognitive'

export interface Milestone {
  id: string
  title: string
  description: string
  category: MilestoneCategory
  monthMin: number
  monthMax: number
  isCustom?: boolean
}

export interface MilestoneAchievement {
  milestoneId: string
  achievedDate: string
  notes?: string
}

export const PREDEFINED_MILESTONES: Milestone[] = [
  // 0–1 месяц
  { id: 'm-0-1', title: 'Фиксирует взгляд на лице', description: 'Смотрит в глаза и удерживает контакт взглядом', category: 'social', monthMin: 0, monthMax: 1 },
  { id: 'm-0-2', title: 'Реагирует на голос', description: 'Успокаивается или поворачивает голову на знакомый голос', category: 'social', monthMin: 0, monthMax: 1 },
  { id: 'm-0-3', title: 'Реагирует на громкие звуки', description: 'Вздрагивает или моргает в ответ на резкий звук', category: 'cognitive', monthMin: 0, monthMax: 1 },
  { id: 'm-0-4', title: 'Хаотичные движения ручек и ножек', description: 'Активно двигает конечностями в состоянии бодрствования', category: 'motor', monthMin: 0, monthMax: 1 },

  // 1–2 месяца
  { id: 'm-1-1', title: 'Первая социальная улыбка', description: 'Улыбается в ответ на ваше лицо или голос', category: 'social', monthMin: 1, monthMax: 2 },
  { id: 'm-1-2', title: 'Следит взглядом за предметом', description: 'Провожает взглядом медленно движущийся объект', category: 'cognitive', monthMin: 1, monthMax: 2 },
  { id: 'm-1-3', title: 'Начинает гулить', description: 'Издаёт протяжные гласные звуки (а-а, у-у)', category: 'speech', monthMin: 1, monthMax: 2 },
  { id: 'm-1-4', title: 'Удерживает голову лёжа на животе', description: 'Приподнимает и удерживает голову на несколько секунд', category: 'motor', monthMin: 1, monthMax: 3 },

  // 2–4 месяца
  { id: 'm-2-1', title: 'Смеётся вслух', description: 'Издаёт смеховые звуки в ответ на игру или ласку', category: 'social', monthMin: 2, monthMax: 4 },
  { id: 'm-2-2', title: 'Узнаёт маму и папу', description: 'Оживляется и улыбается при виде знакомых лиц', category: 'social', monthMin: 2, monthMax: 3 },
  { id: 'm-2-3', title: 'Приподнимает голову и грудь', description: 'Опирается на предплечья, лёжа на животе', category: 'motor', monthMin: 2, monthMax: 4 },
  { id: 'm-2-4', title: 'Тянется к предметам', description: 'Пытается дотянуться до игрушки или пальца', category: 'motor', monthMin: 2, monthMax: 4 },

  // 3–5 месяцев
  { id: 'm-3-1', title: 'Переворот со спины на живот', description: 'Самостоятельно переворачивается в одну или обе стороны', category: 'motor', monthMin: 3, monthMax: 5 },
  { id: 'm-3-2', title: 'Хватает предметы', description: 'Целенаправленно берёт игрушку в руку', category: 'motor', monthMin: 3, monthMax: 4 },
  { id: 'm-3-3', title: 'Реагирует на своё имя', description: 'Поворачивается или оживляется, услышав своё имя', category: 'social', monthMin: 3, monthMax: 5 },
  { id: 'm-3-4', title: 'Исследует свои ручки', description: 'Подолгу рассматривает и тянет ручки ко рту', category: 'cognitive', monthMin: 3, monthMax: 5 },

  // 4–6 месяцев
  { id: 'm-4-1', title: 'Сидит с поддержкой', description: 'Сидит, если ему помогают удерживать спину', category: 'motor', monthMin: 4, monthMax: 6 },
  { id: 'm-4-2', title: 'Лепечет', description: 'Произносит слоги: ба-ба, ма-ма, да-да', category: 'speech', monthMin: 4, monthMax: 6 },
  { id: 'm-4-3', title: 'Перекладывает предметы', description: 'Перекладывает игрушку из одной руки в другую', category: 'motor', monthMin: 4, monthMax: 6 },
  { id: 'm-4-4', title: 'Выражает радость и недовольство', description: 'Чётко различает эмоции по мимике и звукам', category: 'social', monthMin: 4, monthMax: 6 },

  // 6–9 месяцев
  { id: 'm-6-1', title: 'Сидит самостоятельно', description: 'Сидит без поддержки несколько минут', category: 'motor', monthMin: 6, monthMax: 8 },
  { id: 'm-6-2', title: 'Ползёт', description: 'Передвигается ползком (по-пластунски или на четвереньках)', category: 'motor', monthMin: 6, monthMax: 10 },
  { id: 'm-6-3', title: 'Пьёт из кружки с помощью', description: 'Делает глотки из чашки, когда взрослый держит её', category: 'motor', monthMin: 6, monthMax: 9 },
  { id: 'm-6-4', title: 'Машет «пока-пока»', description: 'Имитирует жест прощания', category: 'social', monthMin: 7, monthMax: 10 },
  { id: 'm-6-5', title: 'Говорит «мама» / «папа»', description: 'Произносит осознанно обращение к родителю', category: 'speech', monthMin: 7, monthMax: 10 },

  // 9–12 месяцев
  { id: 'm-9-1', title: 'Встаёт у опоры', description: 'Подтягивается и стоит, держась за мебель', category: 'motor', monthMin: 9, monthMax: 11 },
  { id: 'm-9-2', title: 'Ходит вдоль опоры', description: 'Переступает ногами, держась за диван или стол', category: 'motor', monthMin: 9, monthMax: 12 },
  { id: 'm-9-3', title: 'Выполняет простые просьбы', description: 'Понимает «дай», «нельзя», «иди ко мне»', category: 'cognitive', monthMin: 9, monthMax: 12 },
  { id: 'm-9-4', title: 'Указывает пальцем', description: 'Показывает на интересный предмет указательным пальцем', category: 'social', monthMin: 9, monthMax: 12 },
  { id: 'm-9-5', title: 'Первые самостоятельные шаги', description: 'Делает несколько шагов без поддержки', category: 'motor', monthMin: 10, monthMax: 14 },
  { id: 'm-9-6', title: 'Первые осмысленные слова', description: 'Использует 1–3 слова со значением, помимо мама/папа', category: 'speech', monthMin: 10, monthMax: 14 },
]

interface MilestonesState {
  achievements: MilestoneAchievement[]
  customMilestones: Milestone[]
  markAchieved: (milestoneId: string, date?: string, notes?: string) => void
  unmarkAchieved: (milestoneId: string) => void
  addCustomMilestone: (data: Omit<Milestone, 'id' | 'isCustom'>) => void
  removeCustomMilestone: (id: string) => void
}

export const useMilestonesStore = create<MilestonesState>()(
  persist(
    (set) => ({
      achievements: [],
      customMilestones: [],

      markAchieved: (milestoneId, date, notes) =>
        set((state) => {
          const existing = state.achievements.find((a) => a.milestoneId === milestoneId)
          if (existing) return state
          return {
            achievements: [
              ...state.achievements,
              { milestoneId, achievedDate: date ?? new Date().toISOString(), notes },
            ],
          }
        }),

      unmarkAchieved: (milestoneId) =>
        set((state) => ({
          achievements: state.achievements.filter((a) => a.milestoneId !== milestoneId),
        })),

      addCustomMilestone: (data) =>
        set((state) => ({
          customMilestones: [
            ...state.customMilestones,
            { ...data, id: uuid(), isCustom: true },
          ],
        })),

      removeCustomMilestone: (id) =>
        set((state) => ({
          customMilestones: state.customMilestones.filter((m) => m.id !== id),
          achievements: state.achievements.filter((a) => a.milestoneId !== id),
        })),
    }),
    { name: 'milestones-store' }
  )
)
