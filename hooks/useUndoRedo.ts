'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * F8: Undo/Redo hook for any serializable state.
 * Maintains a history stack for the editor.
 */
export function useUndoRedo<T>(initialState: T, maxHistory = 50) {
  const [state, setState] = useState<T>(initialState);
  const historyRef = useRef<T[]>([initialState]);
  const pointerRef = useRef(0);

  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const resolved = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      const history = historyRef.current;
      const pointer = pointerRef.current;

      // Truncate future history
      const newHistory = history.slice(0, pointer + 1);
      newHistory.push(resolved);

      // Trim if too long
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      } else {
        pointerRef.current = newHistory.length - 1;
      }

      historyRef.current = newHistory;
      if (newHistory.length <= maxHistory) {
        pointerRef.current = newHistory.length - 1;
      }

      return resolved;
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    if (pointerRef.current > 0) {
      pointerRef.current -= 1;
      setState(historyRef.current[pointerRef.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (pointerRef.current < historyRef.current.length - 1) {
      pointerRef.current += 1;
      setState(historyRef.current[pointerRef.current]);
    }
  }, []);

  const canUndo = pointerRef.current > 0;
  const canRedo = pointerRef.current < historyRef.current.length - 1;

  return { state, set, undo, redo, canUndo, canRedo };
}
