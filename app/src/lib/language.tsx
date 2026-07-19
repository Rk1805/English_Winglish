import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/** App-wide language toggle: false = English, true = Gujarati. Persisted. */
const LanguageContext = createContext<{ gu: boolean; toggle: () => void }>({
  gu: false,
  toggle: () => {},
});

const STORAGE_KEY = 'gujarati';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [gu, setGu] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved !== null) setGu(saved === '1');
    });
  }, []);

  const toggle = useCallback(() => {
    setGu((prev) => {
      AsyncStorage.setItem(STORAGE_KEY, prev ? '0' : '1');
      return !prev;
    });
  }, []);

  return <LanguageContext.Provider value={{ gu, toggle }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
