import { useEffect, useState } from "react";
import * as Network from "expo-network";

export default function useNetworkStatus(pollingInterval = 3000) {
  const [isConnected, setIsConnected] = useState(true);

  const checkConnection = async () => {
    try {
      const status = await Network.getNetworkStateAsync();
      setIsConnected(status.isInternetReachable ?? false);
    } catch (error) {
      setIsConnected(false); // assume offline on error
    }
  };

  useEffect(() => {
    checkConnection(); // Initial check

    const interval = setInterval(checkConnection, pollingInterval);
    return () => clearInterval(interval);
  }, []);

  return isConnected;
}
