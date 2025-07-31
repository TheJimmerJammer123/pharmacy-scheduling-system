import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";
import { AppError, createInternalError, ErrorHandler } from "@/lib/error-handling";

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, context?: string) => {
    const appError = error instanceof AppError ? error : createInternalError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );

    // Show user-friendly toast
    toast({
      variant: "destructive",
      title: "Error",
      description: appError.message,
    });

    // Log error for debugging
    ErrorHandler.getInstance().handleError(appError, context);
  }, [toast]);

  const handleValidationError = useCallback((errors: string[]) => {
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: errors.join(", "),
    });
  }, [toast]);

  const handleSuccess = useCallback((message: string) => {
    toast({
      title: "Success",
      description: message,
    });
  }, [toast]);

  return {
    handleError,
    handleValidationError,
    handleSuccess,
  };
}; 