import { Summary } from '../types/summary';
import { SummaryRepository } from '../repositories/summary-repository';
import { AppError, ErrorCodes } from '../types/errors';
import { v4 as uuidv4 } from 'uuid';

export interface OutputRequest {
  outputFormat: 'PDF' | 'PRINT';
}

export interface OutputResponse {
  summaryId: string;
  pdfUrl?: string;
  expiresAt?: string;
  fileSize?: number;
  printData?: string;
}

export class SummaryOutputService {
  private fileStorage: Map<string, { data: Buffer; expiresAt: Date }> = new Map();

  constructor(private summaryRepository: SummaryRepository) {}

  async generateOutput(
    summaryId: string,
    request: OutputRequest
  ): Promise<OutputResponse> {
    // サマリー取得
    const summary = await this.summaryRepository.findById(summaryId);
    if (!summary) {
      throw new AppError(404, ErrorCodes.SUMMARY_NOT_FOUND, 'サマリーが見つかりません');
    }

    if (request.outputFormat === 'PDF') {
      return this.generatePDF(summary);
    } else {
      return this.generatePrintData(summary);
    }
  }

  private async generatePDF(summary: Summary): Promise<OutputResponse> {
    try {
      // HTMLからPDFへの変換（簡易実装）
      // 実際の実装ではpuppeteerやpdfkitなどを使用
      const pdfBuffer = Buffer.from(`PDF content for summary ${summary.summaryId}`);

      // ファイル保存
      const fileId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24時間有効

      this.fileStorage.set(fileId, {
        data: pdfBuffer,
        expiresAt,
      });

      const pdfUrl = `/api/v1/files/${fileId}`;

      return {
        summaryId: summary.summaryId,
        pdfUrl,
        expiresAt: expiresAt.toISOString(),
        fileSize: pdfBuffer.length,
      };
    } catch (error) {
      throw new AppError(500, ErrorCodes.PDF_GENERATION_ERROR, 'PDF生成に失敗しました');
    }
  }

  private generatePrintData(summary: Summary): OutputResponse {
    // 印刷用HTMLデータを返却
    return {
      summaryId: summary.summaryId,
      printData: summary.content,
    };
  }
}

