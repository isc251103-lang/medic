import { Router, Request, Response } from 'express';
import { SummaryGenerationService } from '../services/summary-generation-service';
import { PatientDataService } from '../services/patient-data-service';
import { AuthModule } from '../modules/auth-module';
import { EMRClient } from '../modules/emr-client';
import { DataTransformer } from '../modules/data-transformer';
import { DataValidator } from '../modules/data-validator';
import { CacheManager } from '../modules/cache-manager';
import { TemplateEngine } from '../modules/template-engine';
import { LLMEngine } from '../modules/llm-engine';
import { ContentFormatter } from '../modules/content-formatter';
import { SummaryRepository } from '../repositories/summary-repository';
import { AppError } from '../types/errors';

const router = Router();

// 依存性注入
const authModule = new AuthModule();
const emrClient = new EMRClient();
const dataTransformer = new DataTransformer();
const dataValidator = new DataValidator();
const cacheManager = new CacheManager();
const patientDataService = new PatientDataService(
  authModule,
  emrClient,
  dataTransformer,
  dataValidator,
  cacheManager
);

const templateEngine = new TemplateEngine();
const llmEngine = new LLMEngine();
const contentFormatter = new ContentFormatter();
const summaryRepository = new SummaryRepository();

const summaryGenerationService = new SummaryGenerationService(
  patientDataService,
  templateEngine,
  llmEngine,
  contentFormatter,
  summaryRepository
);

// POST /api/v1/summaries/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { patientId, admissionId, options } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        errorCode: 'UNAUTHORIZED',
        message: '認証トークンが必要です',
      });
    }

    // ユーザーIDの取得（実際の実装ではJWTから取得）
    const userId = 'user001'; // 仮実装

    const result = await summaryGenerationService.generateSummary(
      { patientId, admissionId, options },
      authHeader,
      userId
    );

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    res.status(500).json({
      errorCode: 'INTERNAL_ERROR',
      message: '内部サーバーエラーが発生しました',
    });
  }
});

// GET /api/v1/summaries/:summaryId
router.get('/:summaryId', async (req: Request, res: Response) => {
  try {
    const { summaryId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        errorCode: 'UNAUTHORIZED',
        message: '認証トークンが必要です',
      });
    }

    const { SummaryEditService } = await import('../services/summary-edit-service');
    const summaryEditService = new SummaryEditService(
      summaryRepository,
      authModule,
      contentFormatter
    );

    const result = await summaryEditService.getSummary(summaryId, authHeader);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    res.status(500).json({
      errorCode: 'INTERNAL_ERROR',
      message: '内部サーバーエラーが発生しました',
    });
  }
});

// PUT /api/v1/summaries/:summaryId
router.put('/:summaryId', async (req: Request, res: Response) => {
  try {
    const { summaryId } = req.params;
    const { content } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        errorCode: 'UNAUTHORIZED',
        message: '認証トークンが必要です',
      });
    }

    const userId = 'user001'; // 仮実装

    const { SummaryEditService } = await import('../services/summary-edit-service');
    const summaryEditService = new SummaryEditService(
      summaryRepository,
      authModule,
      contentFormatter
    );

    const result = await summaryEditService.updateSummary(
      summaryId,
      { content },
      authHeader,
      userId
    );
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    res.status(500).json({
      errorCode: 'INTERNAL_ERROR',
      message: '内部サーバーエラーが発生しました',
    });
  }
});

// POST /api/v1/summaries/:summaryId/approve
router.post('/:summaryId/approve', async (req: Request, res: Response) => {
  try {
    const { summaryId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        errorCode: 'UNAUTHORIZED',
        message: '認証トークンが必要です',
      });
    }

    const userId = 'user001'; // 仮実装

    const { SummaryApprovalService } = await import('../services/summary-approval-service');
    const summaryApprovalService = new SummaryApprovalService(
      summaryRepository,
      authModule,
      emrClient
    );

    const result = await summaryApprovalService.approveSummary(summaryId, authHeader, userId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    res.status(500).json({
      errorCode: 'INTERNAL_ERROR',
      message: '内部サーバーエラーが発生しました',
    });
  }
});

// POST /api/v1/summaries/:summaryId/pdf
router.post('/:summaryId/pdf', async (req: Request, res: Response) => {
  try {
    const { summaryId } = req.params;
    const { outputFormat } = req.body;

    const { SummaryOutputService } = await import('../services/summary-output-service');
    const summaryOutputService = new SummaryOutputService(summaryRepository);

    const result = await summaryOutputService.generateOutput(summaryId, { outputFormat });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    res.status(500).json({
      errorCode: 'INTERNAL_ERROR',
      message: '内部サーバーエラーが発生しました',
    });
  }
});

export default router;

