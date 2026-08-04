import { describe, it, expect } from 'vitest'
import {
  MOBILE_MAX_WIDTH,
  clampPanelPosition,
  nextSnappedPosition,
  panelContainerStyleFromPosition,
  type PanelRect,
} from './panelPosition'

const DESKTOP = { width: 1280, height: 800 }
const MOBILE = { width: 375, height: 667 }

// Desktop panel: 480x270 (16:9). Mobile panel: 351x197 (calc(100vw - 24px)).
const desktopRect = (left: number, top: number): PanelRect => ({
  left,
  top,
  right: left + 480,
  bottom: top + 270,
  width: 480,
  height: 270,
})

const mobileRect = (left: number, top: number): PanelRect => ({
  left,
  top,
  right: left + 351,
  bottom: top + 197,
  width: 351,
  height: 197,
})

describe('MOBILE_MAX_WIDTH', () => {
  it('matches the SCSS breakpoint', () => {
    expect(MOBILE_MAX_WIDTH).toBe(767)
  })
})

describe('clampPanelPosition', () => {
  it('desktop: clamps to the 8px right/bottom margin', () => {
    const rect = desktopRect(792, 410) // at rest: right 8, bottom 120
    expect(clampPanelPosition(rect, DESKTOP, 0, 0, false)).toEqual({ right: 8, bottom: 120 })
  })

  it('desktop: follows the horizontal delta', () => {
    const rect = desktopRect(792, 410)
    expect(clampPanelPosition(rect, DESKTOP, -100, 0, false)).toEqual({ right: 108, bottom: 120 })
    expect(clampPanelPosition(rect, DESKTOP, 100, 0, false)).toEqual({ right: 8, bottom: 120 })
  })

  it('desktop: keeps the panel 160px clear of the top bar', () => {
    const rect = desktopRect(792, 410)
    // Dragging up beyond the top margin: bottom must not exceed 370,
    // which puts the panel top at y=160.
    expect(clampPanelPosition(rect, DESKTOP, 0, -500, false)).toEqual({ right: 8, bottom: 370 })
  })

  it('mobile: pins the near-full-width panel to the 12px side margin', () => {
    const rect = mobileRect(12, 458)
    expect(clampPanelPosition(rect, MOBILE, 200, 0, true)).toEqual({ right: 12, bottom: 12 })
    expect(clampPanelPosition(rect, MOBILE, -200, 0, true)).toEqual({ right: 12, bottom: 12 })
  })

  it('mobile: allows the panel top to reach 12px from the viewport top', () => {
    const rect = mobileRect(12, 458)
    expect(clampPanelPosition(rect, MOBILE, 0, -500, true)).toEqual({ right: 12, bottom: 458 })
    // 667 - 197 - 458 = 12px from the top
  })

  it('mobile: bottom clamp keeps 12px clearance', () => {
    const rect = mobileRect(12, 458)
    expect(clampPanelPosition(rect, MOBILE, 0, 500, true)).toEqual({ right: 12, bottom: 12 })
  })
})

describe('nextSnappedPosition', () => {
  it('desktop: snaps left when the left edge is nearer', () => {
    const rect = desktopRect(12, 410)
    expect(nextSnappedPosition(rect, DESKTOP, false)).toEqual({ right: null, bottom: 120, top: null })
  })

  it('desktop: snaps right when the right edge is nearer', () => {
    const rect = desktopRect(792, 410)
    expect(nextSnappedPosition(rect, DESKTOP, false)).toEqual({ right: 8, bottom: 120, top: null })
  })

  it('desktop: preserves the vertical position', () => {
    const rect = desktopRect(300, 200) // bottom = 800 - 470 = 330
    expect(nextSnappedPosition(rect, DESKTOP, false)).toEqual({ right: null, bottom: 330, top: null })
  })

  it('mobile: snaps to the top edge at 12px', () => {
    const rect = mobileRect(12, 12)
    expect(nextSnappedPosition(rect, MOBILE, true)).toEqual({ right: 12, bottom: 0, top: 12 })
  })

  it('mobile: returns to the neutral bottom rest position', () => {
    const rect = mobileRect(12, 458)
    expect(nextSnappedPosition(rect, MOBILE, true)).toEqual({ right: 12, bottom: 0, top: null })
  })
})

describe('panelContainerStyleFromPosition', () => {
  it('right-anchored with neutral vertical: no top/bottom overrides', () => {
    const style = panelContainerStyleFromPosition(12, 0, null)
    expect(style.right).toBe('calc(12px + env(safe-area-inset-right))')
    expect(style.left).toBe('auto')
    expect('top' in style).toBe(false)
    expect('bottom' in style).toBe(false)
  })

  it('left-anchored with a dragged bottom', () => {
    const style = panelContainerStyleFromPosition(null, 120, null)
    expect(style.left).toBe('calc(12px + env(safe-area-inset-left))')
    expect(style.right).toBe('auto')
    expect(style.bottom).toBe('calc(120px + env(safe-area-inset-bottom))')
    expect(style.top).toBe('auto')
  })

  it('top-anchored: bottom forced to auto so the stylesheet bottom cannot stretch the panel', () => {
    const style = panelContainerStyleFromPosition(12, 0, 12)
    expect(style.top).toBe('calc(12px + env(safe-area-inset-top))')
    expect(style.bottom).toBe('auto')
  })

  it('neutral vertical after a mobile bottom snap: no top/bottom keys, stylesheet default applies', () => {
    // Regression guard: bottom 0 + top null must leave the DOM vertical
    // anchors unset so the CSS default above the player bar reapplies.
    const style = panelContainerStyleFromPosition(8, 0, null)
    expect(style.right).toBe('calc(8px + env(safe-area-inset-right))')
    expect('top' in style).toBe(false)
    expect('bottom' in style).toBe(false)
  })
})
