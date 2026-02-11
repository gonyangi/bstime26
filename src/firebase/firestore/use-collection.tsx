'use client';

import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, type DocumentData, type Query, queryEqual } from 'firebase/firestore';

export function useCollection<T = DocumentData>(
  q: Query<DocumentData> | null
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedQuery = useMemo(() => q, [q ? queryEqual(q) : null]);

  useEffect(() => {
    if (!memoizedQuery) {
        setData([]);
        setLoading(false);
        return;
    };

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error(`Error fetching collection:`, err);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  return { data, loading, error };
}
