import { AxiosError } from "axios";
import { errorHandler } from "./errorHandler";

export const asyncHandler = <T extends (...args: any[]) => Promise<any>>(
  handler: T
) => {
  return async (
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await handler(...args);
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AxiosError) {
        errorHandler(err);
      }
      throw err;
    }
  };
};
