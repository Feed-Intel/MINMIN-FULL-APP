import React, { useState } from 'react';

type TimeContextType = {
  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
};

export const TimeContext = React.createContext<TimeContextType>({
  time: Date.now(),
  setTime: (() => {}) as React.Dispatch<React.SetStateAction<number>>,
});

export const useTime = () => React.useContext(TimeContext);

const TimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [time, setTime] = useState<number>(Date.now());

  return (
    <TimeContext.Provider value={{ time, setTime }}>
      {children}
    </TimeContext.Provider>
  );
};

export default TimeProvider;
