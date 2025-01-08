import Modal from '../common/Modal'

const THEMES = [
  "deplayer", "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
  "winter", "dim", "nord", "sunset"
] as const

type ThemeModalProps = {
  theme: string
  setTheme: (theme: string) => void
  isOpen: boolean
  onClose: () => void
}

const ThemeModal = ({ theme, setTheme, isOpen, onClose }: ThemeModalProps) => {
  const toggleTheme = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Theme">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto p-2">
        {THEMES.map((themeName) => (
          <label key={themeName} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="theme-radio"
              className="radio radio-primary radio-sm"
              checked={theme === themeName}
              onChange={() => toggleTheme(themeName)}
            />
            <span className="label-text capitalize flex-1">{themeName}</span>
          </label>
        ))}
      </div>
    </Modal>
  )
}

export { THEMES }
export default ThemeModal 