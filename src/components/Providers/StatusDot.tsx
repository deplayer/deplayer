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

const colors: Record<HealthStatus, string> = {
  connected: 'bg-[oklch(0.72_0.16_145)]',
  checking: 'bg-[oklch(0.78_0.14_75)]',
  unreachable: 'bg-[oklch(0.65_0.20_25)]',
  authFailed: 'bg-[oklch(0.65_0.20_25)]',
  disabled: '',
  unknown: 'bg-[oklch(0.55_0.01_250)]',
}

export const StatusDot = ({ status, className }: Props) => {
  const base = 'inline-block h-2 w-2 rounded-full'
  const pulse = status === 'checking' ? 'animate-pulse' : ''
  const ring = status === 'disabled' ? 'ring-1 ring-[oklch(0.55_0.01_250)]' : ''
  return (
    <span
      role="img"
      aria-label={labels[status]}
      className={classNames(base, colors[status], pulse, ring, className)}
    />
  )
}

export default StatusDot
