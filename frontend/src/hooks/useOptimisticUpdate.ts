import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseOptimisticUpdateOptions<T> {
  queryKey: string[];
  updateFn: (data: T) => Promise<T>;
  onError?: (error: Error) => void;
}

export function useOptimisticUpdate<T>({
  queryKey,
  updateFn,
  onError
}: UseOptimisticUpdateOptions<T>) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const optimisticUpdate = useCallback(
    async (newData: T) => {
      setIsUpdating(true);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<T>(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, newData);

      try {
        // Perform the actual update
        const result = await updateFn(newData);
        
        // Update with the server response
        queryClient.setQueryData(queryKey, result);
        
        return result;
      } catch (error) {
        // Rollback on error
        queryClient.setQueryData(queryKey, previousData);
        
        if (onError) {
          onError(error as Error);
        }
        
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [queryClient, queryKey, updateFn, onError]
  );

  return {
    optimisticUpdate,
    isUpdating
  };
}

// Hook for optimistic list operations (add, remove, update)
export function useOptimisticList<T extends { id: string | number }>({
  queryKey,
  onError
}: {
  queryKey: string[];
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const optimisticAdd = useCallback(
    async (item: T, addFn: (item: T) => Promise<T>) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData<T[]>(queryKey) || [];
      
      queryClient.setQueryData(queryKey, [...previousData, item]);

      try {
        const result = await addFn(item);
        
        queryClient.setQueryData(queryKey, (old: T[] = []) =>
          old.map(oldItem => oldItem.id === item.id ? result : oldItem)
        );
        
        return result;
      } catch (error) {
        queryClient.setQueryData(queryKey, previousData);
        onError?.(error as Error);
        throw error;
      }
    },
    [queryClient, queryKey, onError]
  );

  const optimisticUpdate = useCallback(
    async (item: T, updateFn: (item: T) => Promise<T>) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData<T[]>(queryKey) || [];
      
      queryClient.setQueryData(queryKey, (old: T[] = []) =>
        old.map(oldItem => oldItem.id === item.id ? item : oldItem)
      );

      try {
        const result = await updateFn(item);
        
        queryClient.setQueryData(queryKey, (old: T[] = []) =>
          old.map(oldItem => oldItem.id === item.id ? result : oldItem)
        );
        
        return result;
      } catch (error) {
        queryClient.setQueryData(queryKey, previousData);
        onError?.(error as Error);
        throw error;
      }
    },
    [queryClient, queryKey, onError]
  );

  const optimisticRemove = useCallback(
    async (id: string | number, removeFn: (id: string | number) => Promise<void>) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData<T[]>(queryKey) || [];
      
      queryClient.setQueryData(queryKey, (old: T[] = []) =>
        old.filter(item => item.id !== id)
      );

      try {
        await removeFn(id);
      } catch (error) {
        queryClient.setQueryData(queryKey, previousData);
        onError?.(error as Error);
        throw error;
      }
    },
    [queryClient, queryKey, onError]
  );

  return {
    optimisticAdd,
    optimisticUpdate,
    optimisticRemove
  };
}