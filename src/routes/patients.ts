import { Router, Request, Response } from 'express';
import { PatientDataService } from '../services/patient-data-service';
import { AuthModule } from '../modules/auth-module';
import { EMRClient } from '../modules/emr-client';
import { DataTransformer } from '../modules/data-transformer';
import { DataValidator } from '../modules/data-validator';
import { CacheManager } from '../modules/cache-manager';
import { AppError } from '../types/errors';

const router = Router();

// 依存性注入（実際の実装ではDIコンテナを使用）
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

// GET /api/v1/patients/:patientId
router.get('/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { admissionId } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        errorCode: 'UNAUTHORIZED',
        message: '認証トークンが必要です',
      });
    }

    const patientData = await patientDataService.getPatientData(
      patientId,
      authHeader,
      admissionId as string | undefined
    );

    res.status(200).json(patientData);
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

