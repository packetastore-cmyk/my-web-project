import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mediafetch_history";
const MAX_ITEMS = 50;

export function useHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((items) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, []);

  const addItem = useCallback(
    (item) => {
      setHistory((prev) => {
        const newItem = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          ...item,
          createdAt: new Date().toISOString(),
        };
        const updated = [newItem, ...prev].slice(0, MAX_ITEMS);
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const removeItem = useCallback(
    (id) => {
      setHistory((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const clearAll = useCallback(() => {
    setHistory([]);
    persist([]);
  }, [persist]);

  return { history, addItem, removeItem, clearAll };
}
