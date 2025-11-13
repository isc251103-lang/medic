import { GenerateSummaryRequest, GenerateSummaryResponse, Summary } from '../types/summary';
import { PatientDataService } from './patient-data-service';
import { TemplateEngine } from '../modules/template-engine';
import { LLMEngine } from '../modules/llm-engine';
import { ContentFormatter } from '../modules/content-formatter';
import { SummaryRepository } from '../repositories/summary-repository';
import { AppError, ErrorCodes } from '../types/errors';
import { v4 as uuidv4 } from 'uuid';

export class SummaryGenerationService {
  constructor(
    private patientDataService: PatientDataService,
    private templateEngine: TemplateEngine,
    private llmEngine: LLMEngine,
    private contentFormatter: ContentFormatter,
    private summaryRepository: SummaryRepository
  ) {}

  async generateSummary(
    request: GenerateSummaryRequest,
    token: string,
    userId: string
  ): Promise<GenerateSummaryResponse> {
    // 入力バリデーション
    this.validateInput(request);

    // カルテデータ取得
    let patientData;
    try {
      patientData = await this.patientDataService.getPatientData(
        request.patientId,
        token,
        request.admissionId
      );
    } catch (error: any) {
      throw new AppError(500, ErrorCodes.DATA_FETCH_ERROR, 'カルテデータの取得に失敗しました');
    }

    // テンプレート読み込み
    const templateVersion = request.options?.templateVersion || '1.0';
    let template;
    try {
      template = await this.templateEngine.loadTemplate(templateVersion);
    } catch (error) {
      // デフォルトテンプレートを使用
      template = await this.templateEngine.loadTemplate('1.0');
    }

    // テンプレート適用
    const prompt = this.templateEngine.applyTemplate(
      template,
      patientData,
      request.options
    );

    // LLM生成処理
    let llmResponse;
    try {
      llmResponse = await this.llmEngine.generate(prompt, {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
      });
    } catch (error) {
      throw new AppError(500, ErrorCodes.GENERATION_ERROR, 'サマリー生成に失敗しました');
    }

    // HTML整形
    const htmlContent = this.contentFormatter.formatToHTML(llmResponse.text);

    // 内容検証
    const validationResult = this.contentFormatter.validateContent(htmlContent);
    if (!validationResult.isValid) {
      throw new AppError(
        500,
        ErrorCodes.CONTENT_VALIDATION_ERROR,
        `内容検証エラー: ${validationResult.errors.join(', ')}`
      );
    }

    // ドラフト保存
    const summary: Summary = {
      summaryId: uuidv4(),
      patientId: request.patientId,
      admissionId: request.admissionId,
      status: 'draft',
      content: htmlContent,
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    try {
      const savedSummary = await this.summaryRepository.save(summary);
      return {
        summaryId: savedSummary.summaryId,
        patientId: savedSummary.patientId,
        admissionId: savedSummary.admissionId,
        status: savedSummary.status,
        content: savedSummary.content,
        version: savedSummary.version,
        createdAt: savedSummary.createdAt,
        createdBy: savedSummary.createdBy,
      };
    } catch (error) {
      throw new AppError(500, ErrorCodes.SAVE_ERROR, 'サマリーの保存に失敗しました');
    }
  }

  private validateInput(request: GenerateSummaryRequest): void {
    if (!request.patientId || request.patientId.trim().length === 0) {
      throw new AppError(400, ErrorCodes.INVALID_REQUEST, '患者IDが必須です');
    }

    if (!request.admissionId || request.admissionId.trim().length === 0) {
      throw new AppError(400, ErrorCodes.INVALID_REQUEST, '入院IDが必須です');
    }
  }
}

