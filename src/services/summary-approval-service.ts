import { Summary } from '../types/summary';
import { SummaryRepository } from '../repositories/summary-repository';
import { AuthModule } from '../modules/auth-module';
import { EMRClient } from '../modules/emr-client';
import { AppError, ErrorCodes } from '../types/errors';

export class SummaryApprovalService {
  constructor(
    private summaryRepository: SummaryRepository,
    private authModule: AuthModule,
    private emrClient: EMRClient
  ) {}

  async approveSummary(summaryId: string, token: string, userId: string): Promise<Summary> {
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

    // 必須項目チェック
    this.validateRequiredFields(summary);

    // 承認権限チェック
    const hasPermission = await this.authModule.checkPermission(token, summary.patientId);
    if (!hasPermission) {
      throw new AppError(403, ErrorCodes.APPROVAL_PERMISSION_DENIED, '承認権限がありません');
    }

    // 既に承認済みかチェック
    if (summary.status === 'approved' || summary.status === 'sent') {
      throw new AppError(409, ErrorCodes.ALREADY_APPROVED, '既に承認済みです');
    }

    // ステータス更新
    const approvedSummary = await this.summaryRepository.update(summaryId, {
      status: 'approved',
      updatedBy: userId,
    });

    // 電子カルテシステムに送信（リトライ処理付き）
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        await this.sendToEMR(approvedSummary);
        // 送信成功時はステータスを'sent'に更新
        const sentSummary = await this.summaryRepository.update(summaryId, {
          status: 'sent',
        });
        return sentSummary;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new AppError(503, ErrorCodes.EMR_SEND_ERROR, '電子カルテシステムへの送信に失敗しました');
        }
        // 指数バックオフ
        await this.sleep(Math.pow(2, retryCount - 1) * 1000);
      }
    }

    return approvedSummary;
  }

  private validateRequiredFields(summary: Summary): void {
    const errors: string[] = [];

    // 必須セクションのチェック
    if (!summary.content.includes('患者基本情報')) {
      errors.push('患者基本情報が必須です');
    }
    if (!summary.content.includes('主病名') && !summary.content.includes('病名')) {
      errors.push('病名情報が必須です');
    }
    if (!summary.content.includes('治療経過')) {
      errors.push('治療経過が必須です');
    }

    if (errors.length > 0) {
      throw new AppError(400, ErrorCodes.REQUIRED_FIELD_MISSING, errors.join(', '));
    }
  }

  private async sendToEMR(summary: Summary): Promise<void> {
    // 電子カルテシステムへの送信（簡易実装）
    // 実際の実装ではEMRClientを使用してAPI呼び出し
    // await this.emrClient.sendSummary(summary);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

