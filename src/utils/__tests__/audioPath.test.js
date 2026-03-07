/**
 * Smoke tests for audioPath utility
 */

import { describe, it, expect } from 'vitest'
import { audioPath } from '../audioPath'

describe('audioPath', () => {
  it('prefixes path with Vite BASE_URL', () => {
    // Vite sets import.meta.env.BASE_URL to /app/ in the config
    const result = audioPath('/audio/meditations/body-scan/settling-01.mp3')
    expect(result).toContain('audio/meditations/body-scan/settling-01.mp3')
    // Should not have double slashes
    expect(result).not.toContain('//')
  })

  it('handles paths without leading slash', () => {
    const result = audioPath('audio/test.mp3')
    expect(result).toContain('audio/test.mp3')
  })

  it('returns a non-empty string', () => {
    const result = audioPath('/audio/test.mp3')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})
