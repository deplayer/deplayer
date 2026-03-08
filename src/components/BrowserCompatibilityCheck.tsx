import React from 'react'

interface BrowserRequirement {
  name: string
  check: () => boolean
  description: string
}

const BROWSER_REQUIREMENTS: BrowserRequirement[] = [
  {
    name: 'Web Locks API',
    check: () => typeof navigator !== 'undefined' && 'locks' in navigator,
    description: 'Required for coordinating data access across browser tabs',
  },
  {
    name: 'Web Crypto API',
    check: () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function',
    description: 'Required for generating unique identifiers',
  },
  {
 name: 'SharedWorker',
 check: () => typeof SharedWorker !== 'undefined' || typeof Worker !== 'undefined',
 description: 'Required for background data synchronization',
 },
  {
    name: 'Origin Private File System',
    check: () => typeof navigator !== 'undefined' && 'storage' in navigator,
    description: 'Required for persistent local storage',
  },
]

export const checkBrowserCompatibility = (): { supported: boolean; missing: BrowserRequirement[] } => {
  const missing = BROWSER_REQUIREMENTS.filter((req) => !req.check())
  return {
    supported: missing.length === 0,
    missing,
  }
}

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const BrowserCompatibilityCheck = ({ children, fallback }: Props) => {
  const [compatibility, setCompatibility] = React.useState<{
    checked: boolean
    supported: boolean
    missing: BrowserRequirement[]
  }>({
    checked: false,
    supported: false,
    missing: [],
  })

  React.useEffect(() => {
    const result = checkBrowserCompatibility()
    setCompatibility({
      checked: true,
      supported: result.supported,
      missing: result.missing,
    })
  }, [])

  if (!compatibility.checked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!compatibility.supported) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200 p-4">
        <div className="card bg-base-100 shadow-xl max-w-lg w-full">
          <div className="card-body">
            <h2 className="card-title text-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Browser Not Supported
            </h2>
            <p className="text-base-content/70">
              Your browser is missing some features required by Deplayer. Please use a modern browser
              like Chrome, Firefox, or Edge.
            </p>

            <div className="divider">Missing Features</div>

            <ul className="space-y-2">
              {compatibility.missing.map((req) => (
                <li key={req.name} className="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-error flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <div>
                    <span className="font-medium">{req.name}</span>
                    <p className="text-sm text-base-content/60">{req.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="card-actions justify-end mt-4">
              <a
                href="https://browsehappy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Update Browser
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default BrowserCompatibilityCheck
