import { NextResponse } from 'next/server';

export type ApiResponseData = Record<string, any> | any[] | null;

export interface ApiSuccessResponse<T = ApiResponseData> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export type ApiResponse<T = ApiResponseData> = NextResponse<ApiSuccessResponse<T> | ApiErrorResponse>;

export function successResponse<T = ApiResponseData>(
  data: T,
  message = '操作成功'
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message
  });
}

export function errorResponse(
  message: string,
  status = 500,
  error?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({
    success: false,
    message,
    error
  }, { status });
}

export function paginationResponse<T = any>(
  list: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
) {
  return successResponse({ list, pagination });
}