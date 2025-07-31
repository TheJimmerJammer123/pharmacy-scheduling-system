import { renderHook } from '@testing-library/react';
import { useErrorHandler } from './useErrorHandler';
import { AppError, createInternalError } from '@/lib/error-handling';

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock the error handler
const mockHandleError = jest.fn();
jest.mock('@/lib/error-handling', () => ({
  ...jest.requireActual('@/lib/error-handling'),
  ErrorHandler: {
    getInstance: () => ({
      handleError: mockHandleError,
    }),
  },
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle AppError instances correctly', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const appError = new AppError('Test error message', 'TEST_ERROR', 400);
      
      result.current.handleError(appError, 'test-context');

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Test error message',
      });

      expect(mockHandleError).toHaveBeenCalledWith(appError, 'test-context');
    });

    it('should handle regular Error instances', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const regularError = new Error('Regular error message');
      
      result.current.handleError(regularError);

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Regular error message',
      });

      expect(mockHandleError).toHaveBeenCalledTimes(1);
    });

    it('should handle unknown error types', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const unknownError = 'String error';
      
      result.current.handleError(unknownError);

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });

      expect(mockHandleError).toHaveBeenCalledTimes(1);
    });

    it('should handle null/undefined errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      result.current.handleError(null);

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    });

    it('should pass context to error handler', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const error = new Error('Test error');
      const context = 'specific-operation';
      
      result.current.handleError(error, context);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(AppError),
        context
      );
    });
  });

  describe('handleValidationError', () => {
    it('should handle single validation error', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const errors = ['Field is required'];
      
      result.current.handleValidationError(errors);

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Field is required',
      });
    });

    it('should handle multiple validation errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const errors = [
        'Name is required',
        'Email is invalid',
        'Password must be at least 8 characters',
      ];
      
      result.current.handleValidationError(errors);

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Name is required, Email is invalid, Password must be at least 8 characters',
      });
    });

    it('should handle empty validation errors array', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      result.current.handleValidationError([]);

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Validation Error',
        description: '',
      });
    });
  });

  describe('handleSuccess', () => {
    it('should show success message', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const message = 'Operation completed successfully';
      
      result.current.handleSuccess(message);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: message,
      });
    });

    it('should handle empty success message', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      result.current.handleSuccess('');

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: '',
      });
    });
  });

  describe('hook stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useErrorHandler());
      
      const firstHandleError = result.current.handleError;
      const firstHandleValidationError = result.current.handleValidationError;
      const firstHandleSuccess = result.current.handleSuccess;

      rerender();

      expect(result.current.handleError).toBe(firstHandleError);
      expect(result.current.handleValidationError).toBe(firstHandleValidationError);
      expect(result.current.handleSuccess).toBe(firstHandleSuccess);
    });
  });

  describe('integration scenarios', () => {
    it('should work in typical API error scenario', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      // Simulate API error response
      const apiError = new AppError('User not found', 'USER_NOT_FOUND', 404);
      
      result.current.handleError(apiError, 'user-fetch');

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'User not found',
      });

      expect(mockHandleError).toHaveBeenCalledWith(apiError, 'user-fetch');
    });

    it('should work in form validation scenario', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      // Simulate form validation errors
      const validationErrors = [
        'Email is required',
        'Password must contain uppercase letter',
      ];
      
      result.current.handleValidationError(validationErrors);

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Email is required, Password must contain uppercase letter',
      });
    });

    it('should work in success scenario', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      // Simulate successful operation
      result.current.handleSuccess('User profile updated successfully');

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'User profile updated successfully',
      });
    });
  });
}); 