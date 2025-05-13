'use client';

import { useEffect} from 'react';
import { useAuth } from "../app/auth/hooks/useAuth"
import { initLogRocket } from '../utils/logrocket';
import LogRocket from 'logrocket';

export default function LogRocketInitializer() {
  const { user } = useAuth()

  useEffect(() => {
    initLogRocket();

    if (user) {
        LogRocket.identify(`${user.id}`, {
            name: user.name,
            email: user.email,
            role: user.role,
          });
    }
  }, [user]); // Re-run if user changes

  return null;
}
