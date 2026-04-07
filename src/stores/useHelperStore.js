/**
 * Helper Store
 * Manages: open/closed state for the Helper Modal (transient UI — not persisted)
 *
 * The HelperModal is mounted in AppShell and triggered by the HelperButton in the
 * Header. This store is the bridge between them, mirroring the pattern used by
 * useAIStore.isModalOpen and BoosterConsiderationModal's isModalVisible flag.
 */

import { create } from 'zustand';

export const useHelperStore = create((set) => ({
  isOpen: false,
  openHelper: () => set({ isOpen: true }),
  closeHelper: () => set({ isOpen: false }),
}));
