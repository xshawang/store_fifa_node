import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { SharedService } from 'src/shared/shared.service'

@Injectable()
export class LogInterceptor implements NestInterceptor {
  private readonly ctxPrefix: string = LogInterceptor.name
  private readonly logger: Logger = new Logger(this.ctxPrefix)

  constructor(private readonly sharedService: SharedService) {}

  public intercept(context: ExecutionContext, call$: CallHandler): Observable<any> {
    return call$.handle().pipe(
      tap({
        next: (val: any): void => {
          this.logNext(val, context)
        },
        error: (err: Error): void => {
          this.logError(err, context)
        },
      }),
    )
  }

  private logNext(body: any, context: ExecutionContext): void {
    const req: Request = context.switchToHttp().getRequest<Request>()
    const res: Response = context.switchToHttp().getResponse<Response>()
    const { method, originalUrl } = req
    const { statusCode } = res

    const reqIp = this.sharedService.getReqIP(req)
    this.logger.log(`code: ${statusCode} | method: ${method} | path: ${originalUrl} | ip: ${reqIp}`)
  }

  private logError(error: Error, context: ExecutionContext): void {
    const req: Request = context.switchToHttp().getRequest<Request>()
    const { method, originalUrl } = req
    const reqIp = this.sharedService.getReqIP(req)

    if (error instanceof HttpException) {
      const statusCode: number = error.getStatus()
      if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`code: ${statusCode} | method: ${method} | path: ${originalUrl} | ip: ${reqIp}`)
      } else {
        this.logger.warn(`code: ${statusCode} | method: ${method} | path: ${originalUrl} | ip: ${reqIp}`)
      }
    } else {
      this.logger.error(`code: ${error.message} | method: ${method} | path: ${originalUrl} | ip: ${reqIp}`)
    }
  }
}
