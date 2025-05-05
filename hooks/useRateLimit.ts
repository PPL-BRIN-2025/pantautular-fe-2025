import { useState } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  timeWindow: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  timeWindow: 7 * 60 * 1000, // 7 minutes
};

export const useRateLimit = (config: RateLimitConfig = DEFAULT_CONFIG) => {
  const [attempts, setAttempts] = useState<number[]>([]);

  const checkRateLimit = (): { isAllowed: boolean; timeLeft?: number } => {
    const now = Date.now();
    const recentAttempts = attempts.filter(time => now - time < config.timeWindow);
    
    if (recentAttempts.length >= config.maxAttempts) {
      const timeLeft = Math.ceil((config.timeWindow - (now - recentAttempts[0])) / 1000 / 60);
      return { isAllowed: false, timeLeft };
    }
    return { isAllowed: true };
  };

  const addAttempt = () => {
    setAttempts(prev => [...prev, Date.now()]);
  };

  return {
    checkRateLimit,
    addAttempt
  };
}; 