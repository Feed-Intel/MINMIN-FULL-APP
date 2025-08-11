import { AxiosError } from "axios";
import { errorHandler } from "./errorHandler";

export const asyncHandler = <T extends (...args: any[]) => any>(handler: T) => {
  return async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (err: unknown) {
      if (err instanceof Error) {
        errorHandler(err);
      } else if (err instanceof AxiosError) {
        errorHandler(err);
      }
    }
  };
};
