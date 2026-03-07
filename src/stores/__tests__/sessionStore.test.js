/**
 * Smoke tests for session store exported functions
 * Tests pure utility functions that don't require the full store
 */

import { describe, it, expect } from 'vitest'
import { calculateBoosterDose, shouldShowBooster } from '../useSessionStore'

describe('calculateBoosterDose', () => {
  it('returns 50% of the initial dose, rounded to nearest 5mg', () => {
    expect(calculateBoosterDose(120)).toBe(60) // 120 * 0.5 = 60
    expect(calculateBoosterDose(100)).toBe(50) // 100 * 0.5 = 50
    expect(calculateBoosterDose(130)).toBe(65) // 130 * 0.5 = 65
  })

  it('rounds to nearest 5mg', () => {
    expect(calculateBoosterDose(110)).toBe(55) // 110 * 0.5 = 55 (exact)
    expect(calculateBoosterDose(113)).toBe(55) // 113 * 0.5 = 56.5 → 55
    expect(calculateBoosterDose(117)).toBe(60) // 117 * 0.5 = 58.5 → 60
  })

  it('clamps at minimum 30mg', () => {
    expect(calculateBoosterDose(40)).toBe(30) // 40 * 0.5 = 20 → clamped to 30
    expect(calculateBoosterDose(0)).toBe(30)  // 0 * 0.5 = 0 → clamped to 30
  })

  it('clamps at maximum 75mg', () => {
    expect(calculateBoosterDose(200)).toBe(75) // 200 * 0.5 = 100 → clamped to 75
    expect(calculateBoosterDose(180)).toBe(75) // 180 * 0.5 = 90 → clamped to 75
  })

  it('handles string input', () => {
    expect(calculateBoosterDose('120')).toBe(60)
  })
})

describe('shouldShowBooster', () => {
  it('returns false when booster is null', () => {
    expect(shouldShowBooster(null, {}, {})).toBe(false)
  })

  it('returns false when considerBooster is false', () => {
    expect(shouldShowBooster({ considerBooster: false }, {}, {})).toBe(false)
  })

  it('returns false when booster has been taken', () => {
    const booster = { considerBooster: true, status: 'taken' }
    expect(shouldShowBooster(booster, {}, {})).toBe(false)
  })

  it('returns false when booster has been skipped', () => {
    const booster = { considerBooster: true, status: 'skipped' }
    expect(shouldShowBooster(booster, {}, {})).toBe(false)
  })

  it('returns false when no ingestion time', () => {
    const booster = { considerBooster: true, status: 'pending' }
    expect(shouldShowBooster(booster, {}, {})).toBe(false)
  })

  it('returns false when past 180-minute hard cutoff', () => {
    const booster = { considerBooster: true, status: 'pending' }
    const substanceChecklist = { ingestionTime: Date.now() - 181 * 60 * 1000 }
    expect(shouldShowBooster(booster, substanceChecklist, {})).toBe(false)
  })

  it('returns true when past 90 minutes and status is pending', () => {
    const booster = { considerBooster: true, status: 'pending' }
    const substanceChecklist = { ingestionTime: Date.now() - 91 * 60 * 1000 }
    expect(shouldShowBooster(booster, substanceChecklist, {})).toBe(true)
  })

  it('returns false when only 30 minutes have passed', () => {
    const booster = { considerBooster: true, status: 'pending' }
    const substanceChecklist = { ingestionTime: Date.now() - 30 * 60 * 1000 }
    expect(shouldShowBooster(booster, substanceChecklist, {})).toBe(false)
  })
})
