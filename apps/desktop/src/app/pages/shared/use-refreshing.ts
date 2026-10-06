import { useState } from "react";

export function useRefreshing(task: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await task();
    } finally {
      setRefreshing(false);
    }
  };
  return { refreshing, refresh };
}
