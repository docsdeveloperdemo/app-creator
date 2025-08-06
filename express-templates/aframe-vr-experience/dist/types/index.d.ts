export interface ApiResponse<T> {
    data?: T;
    message: string;
    success: boolean;
    timestamp: string;
}
export interface ErrorResponse {
    error: string;
    message: string;
    timestamp: string;
    statusCode: number;
}
//# sourceMappingURL=index.d.ts.map