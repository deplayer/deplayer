import classNames from 'classnames'

import type { HealthStatus } from '../../types/providers'

type Props = {
  status: HealthStatus
  className?: string
}

const labels: Record<HealthStatus, string> = {
  connected: 'Connected',
  checking: 'Checking…',
  unreachable: 'Unreachable',
  authFailed: 'Authentication failed',
  disabled: 'Disabled',
  unknown: 'Status unknown',
}

/**
 * Use daisyUI semantic tokens so the dot follows the active theme.
 * - connected → success (green family per theme)
 * - checking  → warning (amber family per theme)
 * - unreachable / authFailed → error (red family per theme)
 * - disabled → hollow ring on neutral surface
 * - unknown → muted base-content
 */
const colors: Record<HealthStatus, string> = {
  connected: 'bg-success',
  checking: 'bg-warning motion-safe:animate-pulse',
  unreachable: 'bg-error',
  authFailed: 'bg-error',
  disabled: 'bg-transparent ring-1 ring-base-content/40',
  unknown: 'bg-base-content/40',
}

export const StatusDot = ({ status, className }: Props) => (
  <span
    role="img"
    aria-label={labels[status]}
    className={classNames(
      'inline-block h-2 w-2 rounded-full shrink-0',
      colors[status],
      className,
    )}
  />
)

export default StatusDot
