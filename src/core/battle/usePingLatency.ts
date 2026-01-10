/**
 * usePingLatency Hook
 *
 * Measures round-trip time (RTT) to opponent using ping/pong messages.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BattleMessage } from './types';

interface UsePingLatencyOptions {
  sendMessage: (msg: BattleMessage) => void;
  isConnected: boolean;
}

export function usePingLatency({ sendMessage, isConnected }: UsePingLatencyOptions) {
  const [latency, setLatency] = useState<number | null>(null);
  const pingStartRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Send ping every 2 seconds when connected
  useEffect(() => {
    if (!isConnected) {
      setLatency(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Send initial ping
    pingStartRef.current = performance.now();
    sendMessage({ type: 'ping' });

    // Set up interval for subsequent pings
    intervalRef.current = setInterval(() => {
      pingStartRef.current = performance.now();
      sendMessage({ type: 'ping' });
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isConnected, sendMessage]);

  // Call this when pong received
  const handlePong = useCallback(() => {
    if (pingStartRef.current > 0) {
      const rtt = Math.round(performance.now() - pingStartRef.current);
      setLatency(rtt);
    }
  }, []);

  return { latency, handlePong };
}
