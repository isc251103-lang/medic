import { PatientData } from '../types/patient';
import { AuthModule } from '../modules/auth-module';
import { EMRClient } from '../modules/emr-client';
import { DataTransformer } from '../modules/data-transformer';
import { DataValidator } from '../modules/data-validator';
import { CacheManager } from '../modules/cache-manager';
import { AppError, ErrorCodes } from '../types/errors';

export class PatientDataService {
  constructor(
    private authModule: AuthModule,
    private emrClient: EMRClient,
    private dataTransformer: DataTransformer,
    private dataValidator: DataValidator,
    private cacheManager: CacheManager
  ) {}

  async getPatientData(
    patientId: string,
    token: string,
    admissionId?: string
  ): Promise<PatientData> {
    // 入力バリデーション
    this.validateInput(patientId);

    // 認証・認可チェック
    const isAuthenticated = await this.authModule.verifyToken(token);
    if (!isAuthenticated) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, '認証に失敗しました');
    }

    const hasPermission = await this.authModule.checkPermission(token, patientId);
    if (!hasPermission) {
      throw new AppError(403, ErrorCodes.FORBIDDEN, 'アクセス権限がありません');
    }

    // キャッシュ確認
    const cacheKey = admissionId
      ? `patient:${patientId}:admission:${admissionId}`
      : `patient:${patientId}`;
    const cachedData = await this.cacheManager.get<PatientData>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // 電子カルテシステムからデータ取得（リトライ処理付き）
    let emrData;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        emrData = await this.emrClient.fetchPatientData(patientId, admissionId);
        break;
      } catch (error: any) {
        // 404エラー（患者が見つからない）の場合はリトライしない
        if (error.message && error.message.includes('Patient not found')) {
          throw new AppError(404, ErrorCodes.PATIENT_NOT_FOUND, '患者が見つかりません');
        }

        retryCount++;
        if (retryCount >= maxRetries) {
          throw new AppError(
            503,
            ErrorCodes.EMR_SYSTEM_ERROR,
            '電子カルテシステムとの通信に失敗しました'
          );
        }
        // 指数バックオフ: 1秒、2秒、4秒
        await this.sleep(Math.pow(2, retryCount - 1) * 1000);
      }
    }

    if (!emrData) {
      throw new AppError(404, ErrorCodes.PATIENT_NOT_FOUND, '患者が見つかりません');
    }

    // データ変換
    let patientData: PatientData;
    try {
      patientData = this.dataTransformer.transform(emrData);
    } catch (error) {
      throw new AppError(
        500,
        ErrorCodes.DATA_CONVERSION_ERROR,
        'データ変換に失敗しました'
      );
    }

    // データ整合性チェック
    const validationResult = this.dataValidator.validate(patientData);
    if (!validationResult.isValid) {
      throw new AppError(
        500,
        ErrorCodes.DATA_VALIDATION_ERROR,
        `データ検証エラー: ${validationResult.errors.join(', ')}`
      );
    }

    // キャッシュ保存
    await this.cacheManager.set(cacheKey, patientData, 3600); // 1時間

    return patientData;
  }

  private validateInput(patientId: string): void {
    if (!patientId || patientId.trim().length === 0) {
      throw new AppError(400, ErrorCodes.INVALID_PATIENT_ID, '患者IDが無効です');
    }

    if (patientId.length > 20) {
      throw new AppError(400, ErrorCodes.INVALID_PATIENT_ID, '患者IDは20文字以内で指定してください');
    }

    // 英数字チェック
    if (!/^[a-zA-Z0-9]+$/.test(patientId)) {
      throw new AppError(400, ErrorCodes.INVALID_PATIENT_ID, '患者IDは英数字のみ使用可能です');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

