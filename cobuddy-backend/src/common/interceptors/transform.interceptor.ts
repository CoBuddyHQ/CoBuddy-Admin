import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: PaginationMeta | Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((raw: any) => {
        const data = raw?.data !== undefined ? raw.data : raw;
        const message = raw?.message || 'OK';
        const meta = raw?.meta || undefined;

        if (req.id) {
          res.setHeader('X-Request-Id', req.id);
        }

        return {
          success: true,
          data,
          message,
          meta,
        };
      }),
    );
  }
}
