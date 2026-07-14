import { useEffect, useState } from "react";
import { checkApiConnection, getNetworkStatus, markNetworkOffline, subscribeNetworkStatus } from "@/lib/networkStatus";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => getNetworkStatus());

  useEffect(() => {
    const unsubscribe = subscribeNetworkStatus(setIsOnline);
    const updateOnline = () => {
      void checkApiConnection({ force: true });
    };
    const updateOffline = () => {
      markNetworkOffline();
    };

    void checkApiConnection({ force: true });
    const interval = window.setInterval(() => {
      void checkApiConnection();
    }, 30000);

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOffline);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOffline);
    };
  }, []);

  return { isOnline };
}
