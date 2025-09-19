import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Serializer<T> = {
  serialize: (value: T) => string;
  deserialize: (value: string) => T;
};

const DEFAULT_SERIALIZER: Serializer<any> = {
  serialize: JSON.stringify,
  deserialize: JSON.parse,
};

export function usePersistentFilters<T>(
  storageKey: string,
  initialValue: T,
  serializer: Serializer<T> = DEFAULT_SERIALIZER
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const isMounted = useRef(true);
  const serializerRef = useRef(serializer);

  useEffect(() => {
    serializerRef.current = serializer;
  }, [serializer]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    async function hydrate() {
      try {
        const storedValue = await AsyncStorage.getItem(storageKey);
        if (storedValue !== null) {
          const parsed = serializerRef.current.deserialize(storedValue);
          if (isMounted.current) {
            setValue(parsed);
          }
        }
      } catch (error) {
        console.warn(`Failed to restore filters for ${storageKey}:`, error);
      } finally {
        if (isMounted.current) {
          setIsHydrated(true);
        }
      }
    }

    hydrate();
  }, [storageKey, serializer]);

  useEffect(() => {
    if (!isHydrated) return;

    async function persist() {
      try {
        const serialized = serializerRef.current.serialize(value);
        await AsyncStorage.setItem(storageKey, serialized);
      } catch (error) {
        console.warn(`Failed to persist filters for ${storageKey}:`, error);
      }
    }

    persist();
  }, [value, storageKey, isHydrated]);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return { value, setValue, reset, isHydrated } as const;
}
