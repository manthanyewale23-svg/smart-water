import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { sensorsApi } from '../api';
import { Sensor } from '../types';

interface DemoContextType {
  isRunning: boolean;
  startDemo: () => void;
  stopDemo: () => void;
  lastUpdate: Date | null;
  alertTriggered: string | null;
  updatedSensors: Sensor[];
}

const DemoContext = createContext<DemoContextType>(null!);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [alertTriggered, setAlertTriggered] = useState<string | null>(null);
  const [updatedSensors, setUpdatedSensors] = useState<Sensor[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startDemo = useCallback(() => {
    setIsRunning(true);
    intervalRef.current = setInterval(async () => {
      try {
        const res = await sensorsApi.demoUpdate();
        setLastUpdate(new Date());
        setUpdatedSensors(res.data.sensors || []);
        if (res.data.alert) {
          setAlertTriggered(res.data.alert.message);
          setTimeout(() => setAlertTriggered(null), 8000);
        }
      } catch { /* ignore */ }
    }, 3000);
  }, []);

  const stopDemo = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAlertTriggered(null);
    setUpdatedSensors([]);
  }, []);

  return (
    <DemoContext.Provider value={{ isRunning, startDemo, stopDemo, lastUpdate, alertTriggered, updatedSensors }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => useContext(DemoContext);
