import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export type AppErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export type ErrorResponseBody = {
  error: {
    code: AppErrorCode
    message: string
  }
}

const statusByCode: Record<AppErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
}

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly status: number

  constructor(code: AppErrorCode, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = statusByCode[code]
  }
}

export function errorResponse(error: unknown): NextResponse<ErrorResponseBody> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status }
    )
  }

  if (error instanceof ZodError) {
    const validationMessage: string =
      error.issues[0]?.message ?? 'Los datos enviados no son válidos'

    return NextResponse.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: validationMessage,
        },
      },
      { status: statusByCode.BAD_REQUEST }
    )
  }

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error interno del servidor',
      },
    },
    { status: statusByCode.INTERNAL_ERROR }
  )
}
