import { HttpSuccessResponse } from '../Http/HttpResponse'

export type CloseUploadSessionResponse = HttpSuccessResponse<{ success: boolean; message: string }>
