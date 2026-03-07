/**
 * Smoke tests for Zustand stores
 * Verifies that each store initializes correctly with expected default state
 */

import { describe, it, expect } from 'vitest'
import { useAppStore } from '../useAppStore'
import { useToolsStore } from '../useToolsStore'

describe('useAppStore', () => {
  it('initializes with expected defaults', () => {
    const state = useAppStore.getState()
    expect(state.currentTab).toBeDefined()
    expect(typeof state.darkMode).toBe('boolean')
    expect(state.preferences).toBeDefined()
    expect(typeof state.setCurrentTab).toBe('function')
    expect(typeof state.toggleDarkMode).toBe('function')
    expect(typeof state.setPreference).toBe('function')
  })

  it('sets current tab', () => {
    useAppStore.getState().setCurrentTab('active')
    expect(useAppStore.getState().currentTab).toBe('active')
    useAppStore.getState().setCurrentTab('home')
  })

  it('toggles dark mode', () => {
    const before = useAppStore.getState().darkMode
    useAppStore.getState().toggleDarkMode()
    expect(useAppStore.getState().darkMode).toBe(!before)
    // Toggle back
    useAppStore.getState().toggleDarkMode()
    expect(useAppStore.getState().darkMode).toBe(before)
  })

  it('sets individual preferences', () => {
    useAppStore.getState().setPreference('reduceMotion', true)
    expect(useAppStore.getState().preferences.reduceMotion).toBe(true)
    // Reset
    useAppStore.getState().setPreference('reduceMotion', false)
  })
})

describe('useToolsStore', () => {
  it('initializes with empty openTools array', () => {
    const state = useToolsStore.getState()
    expect(Array.isArray(state.openTools)).toBe(true)
  })

  it('toggles a tool open and closed', () => {
    useToolsStore.getState().toggleTool('breath')
    expect(useToolsStore.getState().openTools).toContain('breath')

    useToolsStore.getState().toggleTool('breath')
    expect(useToolsStore.getState().openTools).not.toContain('breath')
  })

  it('closes a specific tool', () => {
    useToolsStore.getState().toggleTool('breath')
    expect(useToolsStore.getState().openTools).toContain('breath')
    useToolsStore.getState().closeTool('breath')
    expect(useToolsStore.getState().openTools).not.toContain('breath')
  })
})
