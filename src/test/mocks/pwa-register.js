import { useState } from 'react';

export function useRegisterSW() {
  const [needRefresh, setNeedRefresh] = useState(false);
  return {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker: () => {},
  };
}
