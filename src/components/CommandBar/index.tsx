import { Dispatch } from 'redux'
import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Icon from '../common/Icon'
import Button from '../common/Button'
import * as types from '../../constants/ActionTypes'
import { IconType } from '../common/Icon'

interface Command {
  id: number
  name: string
  command: () => void
  icon?: IconType
}

interface Props {
  dispatch: Dispatch
}

function CommandBar({ dispatch }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = [
    {
      id: 1,
      name: "Add new media",
      icon: 'faPlusCircle',
      command() {
        return dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })
      }
    },
    {
      id: 2,
      name: "Toggle visuals",
      icon: 'faBahai',
      command() {
        return dispatch({ type: types.TOGGLE_VISUALS })
      }
    },
    {
      id: 3,
      name: "Toggle spectrum",
      icon: 'faDeezer',
      command() {
        return dispatch({ type: types.TOGGLE_SPECTRUM })
      }
    }
  ]

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(true)
      }
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        )
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
      }
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        filteredCommands[selectedIndex].command()
        setIsOpen(false)
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex])

  const handleClose = () => {
    setIsOpen(false)
    setSearch('')
    setSelectedIndex(0)
  }

  return (
    <div className='px-6 py-4 text-xs w-full flex justify-center items-center'>
      <Button
        transparent
        onClick={() => setIsOpen(true)}
        className="btn btn-ghost btn-sm"
      >
        <Icon icon="faSearch" className="mr-2" />
        <span>Search commands...</span>
        <kbd className="ml-2 px-2 py-1 text-xs bg-base-200 rounded">⌘K</kbd>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Command Palette"
      >
        <div className="flex flex-col">
          <div className="p-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Search commands..."
              className="input input-bordered w-full"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.command()
                  handleClose()
                }}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-base-200 ${
                  index === selectedIndex ? 'bg-base-200' : ''
                }`}
              >
                {cmd.icon && <Icon icon={cmd.icon} />}
                <span>{cmd.name}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CommandBar
