'use client';

import { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';

/**
 * F9: Drag & drop reorder for list items.
 * Simple HTML5 DnD implementation without external deps.
 */
interface DragReorderListProps<T> {
  items: T[];
  onReorder: (reordered: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function DragReorderList<T>({ items, onReorder, renderItem, keyExtractor }: DragReorderListProps<T>) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragItem = useRef<T | null>(null);

  function handleDragStart(e: React.DragEvent, idx: number) {
    dragItem.current = items[idx];
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  }

  function handleDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) return;

    const reordered = [...items];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    onReorder(reordered);

    setDragIdx(null);
    setOverIdx(null);
    dragItem.current = null;
  }

  function handleDragEnd() {
    setDragIdx(null);
    setOverIdx(null);
    dragItem.current = null;
  }

  return (
    <div>
      {items.map((item, idx) => (
        <div
          key={keyExtractor(item)}
          draggable
          onDragStart={e => handleDragStart(e, idx)}
          onDragOver={e => handleDragOver(e, idx)}
          onDrop={e => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          className={`flex items-start gap-2 transition-all ${
            dragIdx === idx ? 'opacity-50' : ''
          } ${
            overIdx === idx && dragIdx !== null && dragIdx !== idx
              ? 'border-t-2 border-primary'
              : ''
          }`}
        >
          <div className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1">{renderItem(item, idx)}</div>
        </div>
      ))}
    </div>
  );
}
