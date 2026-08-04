import * as React from 'react'

// Single source of truth for the visualizer panel's anchored position.
// LayoutContainer derives the style prop, the drag release applies the same
// derivation to the DOM directly (React's style diff skips unchanged props
// after the drag mutated the DOM live), and the pure math here is unit-tested.

// Must match the @media (max-width: 767px) breakpoint in src/styles/layout.scss
export const MOBILE_MAX_WIDTH = 767

// Matches DOMRect's fields the drag math needs; plain objects are fine in tests.
export type PanelRect = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export type PanelPosition = {
  right: number | null // null = left-anchored (left: 12px); number = distance from the right edge
  bottom: number // 0 = neutral, stylesheet default bottom applies
  top: number | null // null = bottom-anchored; set on mobile top-snap
}

export type Viewport = {
  width: number
  height: number
}

// Live drag position after applying the pointer delta, clamped to the
// viewport. Mobile: the panel is near-full-width, so vertical drag is the
// primary gesture and may reach the top of the viewport; side margins are
// 12px to match calc(100vw - 24px). Desktop: right margin 8px, and the panel
// stays 160px clear of the top bar.
export const clampPanelPosition = (
  rect: PanelRect,
  viewport: Viewport,
  dx: number,
  dy: number,
  isMobile: boolean
): { right: number; bottom: number } => {
  const newRight = viewport.width - rect.right - dx
  const newBottom = viewport.height - rect.bottom - dy

  const sideMargin = isMobile ? 12 : 8
  const topMargin = isMobile ? 12 : 160

  const right = Math.max(sideMargin, Math.min(newRight, viewport.width - rect.width - sideMargin))
  const bottom = Math.max(
    sideMargin,
    Math.min(newBottom, viewport.height - rect.height - topMargin)
  )
  return { right, bottom }
}

// Snap on release. Mobile: vertical snap to the top edge (anchored at 12px)
// or back to the CSS default rest position above the player bar (neutral
// bottom). Desktop: snap to the nearest horizontal edge, vertical preserved.
export const nextSnappedPosition = (
  rect: PanelRect,
  viewport: Viewport,
  isMobile: boolean
): PanelPosition => {
  const currentRight = viewport.width - rect.right

  if (isMobile) {
    const topEdge = rect.top
    const bottomEdge = viewport.height - rect.bottom
    if (topEdge <= bottomEdge) {
      return { right: currentRight, bottom: 0, top: 12 }
    }
    return { right: currentRight, bottom: 0, top: null }
  }

  const rightEdge = viewport.width - rect.right
  const leftEdge = rect.left
  const right = leftEdge < rightEdge ? null : rightEdge
  const bottom = viewport.height - rect.bottom
  return { right, bottom, top: null }
}

// Anchored position styles. Safe-area insets keep the panel clear of notches
// (0 on desktop). The neutral state (bottom 0, top null) leaves top/bottom
// unset so the stylesheet default above the player bar applies.
export const panelContainerStyleFromPosition = (
  right: number | null,
  bottom: number,
  top: number | null
): React.CSSProperties => {
  const style: React.CSSProperties = {}
  if (right !== null) {
    style.right = `calc(${right}px + env(safe-area-inset-right))`
    style.left = 'auto'
  } else {
    style.left = 'calc(12px + env(safe-area-inset-left))'
    style.right = 'auto'
  }
  if (top !== null) {
    style.top = `calc(${top}px + env(safe-area-inset-top))`
    style.bottom = 'auto'
  } else if (bottom !== 0) {
    style.bottom = `calc(${bottom}px + env(safe-area-inset-bottom))`
    style.top = 'auto'
  }
  return style
}
