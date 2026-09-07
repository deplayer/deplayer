import React from 'react'
import ReactDOM from 'react-dom'
import Icon from '../Icon'

type Props = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

const Modal = ({ isOpen, onClose, children, title, className }: Props) => {
  const modalBoxRef = React.useRef<HTMLDivElement>(null)

  // Focus the close button when the modal opens and restore focus on close.
  // (Effects must run before any early return.)
  React.useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const timer = setTimeout(() => {
      const closeBtn = modalBoxRef.current?.querySelector('button')
      closeBtn?.focus()
    }, 0)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // Simple focus trap
      const modalEl = modalBoxRef.current
      if (!modalEl) return
      const focusable = Array.from(
        modalEl.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isOpen, onClose])

  const modalRoot = document.getElementById('modal-root') || document.body

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div className="modal modal-open">
      <div
        ref={modalBoxRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-box relative ${className || ''}`}
      >
        <button
          className="btn btn-sm btn-circle absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon icon="faTimes" />
        </button>
        {title && <h3 className="text-lg pr-8">{title}</h3>}
        {children}
      </div>
      <div
          className="modal-backdrop"
          onClick={onClose}
        ></div>
    </div>,
    modalRoot
  )
}

export default Modal
