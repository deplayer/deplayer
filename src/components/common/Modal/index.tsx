import React from 'react'
import ReactDOM from 'react-dom'

type Props = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

const Modal = ({ isOpen, onClose, children, title }: Props) => {
  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div className="modal modal-open">
      <div className="modal-box">
        {title && <h3 className="font-bold text-lg">{title}</h3>}
        {children}
        <div className="modal-action">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>,
    document.getElementById('modal')!
  )
}

export default Modal
