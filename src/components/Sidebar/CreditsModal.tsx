import Modal from '../common/Modal'
import { identity } from '../../brand/identity.js'
import { signature } from '../../brand/signature.js'

type CreditsModalProps = {
  isOpen: boolean
  onClose: () => void
}

const LICENCES = [
  { name: 'deplayer', licence: 'MIT' },
  { name: 'React', licence: 'MIT' },
  { name: 'Vite', licence: 'MIT' },
  { name: 'Tailwind CSS', licence: 'MIT' },
  { name: 'daisyUI', licence: 'MIT' },
  { name: 'LiveStore', licence: 'Apache-2.0' },
  { name: 'Zustand', licence: 'MIT' },
  { name: 'Redux Saga', licence: 'MIT' },
  { name: 'WebTorrent', licence: 'MIT' },
  { name: 'Butterchurn', licence: 'MIT' },
  { name: 'Font Awesome Free (icons)', licence: 'CC-BY-4.0 AND MIT' },
] as const

const primaryLinks = [
  { id: 'site', label: signature.display, url: signature.url },
  ...identity.links.filter((l) => l.primary).map((l) => ({ id: l.id, label: l.label, url: l.url })),
]

const CreditsModal = ({ isOpen, onClose }: CreditsModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Credits">
    <div className="flex flex-col gap-4 text-sm max-h-[60vh] overflow-y-auto p-2">
      <section>
        <p className="font-mono text-base-content/70">{signature.credit}</p>
        <p className="mt-2">{identity.bio.short}</p>
      </section>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono">
        {primaryLinks.map((l) => (
          <li key={l.id}>
            <a href={l.url} target="_blank" rel="noreferrer" className="link link-primary">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <section>
        <h3 className="font-semibold mb-2">Third-party licences</h3>
        <ul className="font-mono text-xs text-base-content/70">
          {LICENCES.map((l) => (
            <li key={l.name} className="flex justify-between gap-4 border-b border-base-300 py-1">
              <span>{l.name}</span>
              <span>{l.licence}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  </Modal>
)

export default CreditsModal
