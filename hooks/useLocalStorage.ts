import React, { useState, useEffect } from 'react';

/**
 * A custom hook to synchronize state with localStorage.
 * It retrieves the value from localStorage on initial render and
 * updates localStorage whenever the state changes.
 *
 * @param key The key to use for storing the value in localStorage.
 * @param initialValue The initial value to use if no value is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // This function is the initializer for useState and runs only once.
    try {
      const item = window.localStorage.getItem(key);
      // If a value exists in localStorage, parse it. Otherwise, use the initial value.
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If parsing fails, log the error and fall back to the initial value.
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return initialValue;
    }
  });

  // This effect synchronizes the state with localStorage whenever the key or value changes.
  useEffect(() => {
    try {
      // Convert the state to a JSON string and save it to localStorage.
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      // If storing fails, log the error.
      console.error(`Error writing to localStorage for key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}