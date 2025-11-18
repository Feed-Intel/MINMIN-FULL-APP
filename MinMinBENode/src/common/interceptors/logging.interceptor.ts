import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const time = Date.now() - startedAt;
        const method = request?.method ?? 'N/A';
        const url = request?.url ?? 'N/A';
        // eslint-disable-next-line no-console
        console.log(`[${method}] ${url} - ${time}ms`);
      }),
    );
  }
}
