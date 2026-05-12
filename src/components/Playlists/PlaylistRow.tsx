import { memo, useCallback, useRef, KeyboardEvent } from 'react'
import { Translate } from 'react-redux-i18n'
import Icon, { IconType } from '../common/Icon'

type Props = {
  title?: string
  icon?: IconType
  actions?: React.ReactNode
  children: React.ReactNode
}

const CARD_SCROLL_STEP = 272 // w-64 card + gap-4

const PlaylistRow = memo(({ title, icon, actions, children }: Props) => {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollBy = useCallback((delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollBy(CARD_SCROLL_STEP)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollBy(-CARD_SCROLL_STEP)
    }
  }, [scrollBy])

  return (
    <section className="mb-10">
      {title && (
        <header className="flex items-center justify-between px-4 mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {icon && <Icon icon={icon} />}
            <Translate value={title} />
          </h2>
          <div className="flex items-center gap-1">
            {actions}
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Scroll left"
              onClick={() => scrollBy(-CARD_SCROLL_STEP)}
            >
              <Icon icon="faChevronLeft" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Scroll right"
              onClick={() => scrollBy(CARD_SCROLL_STEP)}
            >
              <Icon icon="faChevronRight" />
            </button>
          </div>
        </header>
      )}
      <div
        ref={scrollerRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-2 scrollbar-none focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-box"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
    </section>
  )
})

export default PlaylistRow
