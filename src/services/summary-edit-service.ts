import { Summary } from '../types/summary';
import { SummaryRepository } from '../repositories/summary-repository';
import { AuthModule } from '../modules/auth-module';
import { ContentFormatter } from '../modules/content-formatter';
import { AppError, ErrorCodes } from '../types/errors';

export interface UpdateSummaryRequest {
  content: string;
}

export class SummaryEditService {
  constructor(
    private summaryRepository: SummaryRepository,
    private authModule: AuthModule,
    private contentFormatter: ContentFormatter
  ) {}

  async getSummary(summaryId: string, token: string): Promise<Summary> {
    // 認証チェック
    const isAuthenticated = await this.authModule.verifyToken(token);
    if (!isAuthenticated) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, '認証に失敗しました');
    }

    // サマリー取得
    const summary = await this.summaryRepository.findById(summaryId);
    if (!summary) {
      throw new AppError(404, ErrorCodes.SUMMARY_NOT_FOUND, 'サマリーが見つかりません');
    }

    // 編集権限チェック（簡易実装）
    const hasPermission = await this.authModule.checkPermission(token, summary.patientId);
    if (!hasPermission) {
      throw new AppError(403, ErrorCodes.EDIT_PERMISSION_DENIED, '編集権限がありません');
    }

    return summary;
  }

  async updateSummary(
    summaryId: string,
    request: UpdateSummaryRequest,
    token: string,
    userId: string
  ): Promise<Summary> {
    // 認証チェック
    const isAuthenticated = await this.authModule.verifyToken(token);
    if (!isAuthenticated) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, '認証に失敗しました');
    }

    // サマリー取得
    const existingSummary = await this.summaryRepository.findById(summaryId);
    if (!existingSummary) {
      throw new AppError(404, ErrorCodes.SUMMARY_NOT_FOUND, 'サマリーが見つかりません');
    }

    // 編集権限チェック
    const hasPermission = await this.authModule.checkPermission(token, existingSummary.patientId);
    if (!hasPermission) {
      throw new AppError(403, ErrorCodes.EDIT_PERMISSION_DENIED, '編集権限がありません');
    }

    // バリデーション
    const validationResult = this.contentFormatter.validateContent(request.content);
    if (!validationResult.isValid) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        `バリデーションエラー: ${validationResult.errors.join(', ')}`
      );
    }

    // バージョン更新
    const updatedSummary = await this.summaryRepository.update(summaryId, {
      content: request.content,
      version: existingSummary.version + 1,
      updatedBy: userId,
    });

    return updatedSummary;
  }
}

