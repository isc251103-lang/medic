import { PatientDataService } from '../services/patient-data-service';
import { AuthModule } from '../modules/auth-module';
import { EMRClient } from '../modules/emr-client';
import { DataTransformer } from '../modules/data-transformer';
import { DataValidator } from '../modules/data-validator';
import { CacheManager } from '../modules/cache-manager';
import { PatientData, EMRPatientData } from '../types/patient';
import { ErrorCodes } from '../types/errors';

// モジュールのモック
jest.mock('../modules/auth-module');
jest.mock('../modules/emr-client');
jest.mock('../modules/data-transformer');
jest.mock('../modules/data-validator');
jest.mock('../modules/cache-manager');

describe('PatientDataService', () => {
  let service: PatientDataService;
  let mockAuthModule: jest.Mocked<AuthModule>;
  let mockEMRClient: jest.Mocked<EMRClient>;
  let mockDataTransformer: jest.Mocked<DataTransformer>;
  let mockDataValidator: jest.Mocked<DataValidator>;
  let mockCacheManager: jest.Mocked<CacheManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuthModule = new AuthModule() as jest.Mocked<AuthModule>;
    mockEMRClient = new EMRClient() as jest.Mocked<EMRClient>;
    mockDataTransformer = new DataTransformer() as jest.Mocked<DataTransformer>;
    mockDataValidator = new DataValidator() as jest.Mocked<DataValidator>;
    mockCacheManager = new CacheManager() as jest.Mocked<CacheManager>;

    service = new PatientDataService(
      mockAuthModule,
      mockEMRClient,
      mockDataTransformer,
      mockDataValidator,
      mockCacheManager
    );
  });

  describe('TC-FUNC01-001: 正常系 - 患者データ取得成功', () => {
    it('should return patient data successfully', async () => {
      // Given
      const patientId = 'P001';
      const token = 'valid-token';
      const mockPatientData: PatientData = {
        patientId: 'P001',
        basicInfo: {
          name: '山田 太郎',
          nameKana: 'ヤマダ タロウ',
          birthDate: '1980-01-01',
          gender: '男性',
          contact: '03-1234-5678',
        },
        admissionInfo: {
          admissionId: 'A001',
          admissionDate: '2024-01-01',
          dischargeDate: '2024-01-15',
          department: '内科',
          attendingPhysician: '佐藤 一郎',
          ward: '3階東病棟',
        },
        diagnoses: [
          {
            code: 'I10',
            name: '本態性高血圧症',
            type: 'primary',
          },
        ],
        symptoms: '頭痛、めまい',
        examinations: {
          bloodTests: [],
          imagingTests: [],
        },
        treatments: '降圧薬を処方し、経過観察を行った。',
        nursingRecords: '特に問題なし。',
        prescriptions: [
          {
            medicineName: 'アムロジピン',
            dosage: '5mg',
            frequency: '1日1回',
          },
        ],
        guidance: '塩分制限、適度な運動を心がけること。',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockCacheManager.get.mockResolvedValue(null);
      mockEMRClient.fetchPatientData.mockResolvedValue({} as EMRPatientData);
      mockDataTransformer.transform.mockReturnValue(mockPatientData);
      mockDataValidator.validate.mockReturnValue({ isValid: true, errors: [] });

      // When
      const result = await service.getPatientData(patientId, token);

      // Then
      expect(result).toEqual(mockPatientData);
      expect(mockAuthModule.verifyToken).toHaveBeenCalledWith(token);
      expect(mockAuthModule.checkPermission).toHaveBeenCalledWith(token, patientId);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`patient:${patientId}`);
      expect(mockEMRClient.fetchPatientData).toHaveBeenCalledWith(patientId, undefined);
      expect(mockDataTransformer.transform).toHaveBeenCalled();
      expect(mockDataValidator.validate).toHaveBeenCalledWith(mockPatientData);
      expect(mockCacheManager.set).toHaveBeenCalledWith(`patient:${patientId}`, mockPatientData, 3600);
    });
  });

  describe('TC-FUNC01-002: 異常系 - 患者IDが無効', () => {
    it('should throw error when patientId is empty', async () => {
      // Given
      const patientId = '';
      const token = 'valid-token';

      // When & Then
      await expect(service.getPatientData(patientId, token)).rejects.toThrow();
      expect(mockAuthModule.verifyToken).not.toHaveBeenCalled();
    });

    it('should throw error when patientId exceeds 20 characters', async () => {
      // Given
      const patientId = 'P'.repeat(21);
      const token = 'valid-token';

      // When & Then
      await expect(service.getPatientData(patientId, token)).rejects.toThrow();
    });
  });

  describe('TC-FUNC01-003: 異常系 - 認証トークンが無効', () => {
    it('should throw UNAUTHORIZED error when token is invalid', async () => {
      // Given
      const patientId = 'P001';
      const token = 'invalid-token';

      mockAuthModule.verifyToken.mockResolvedValue(false);

      // When & Then
      await expect(service.getPatientData(patientId, token)).rejects.toMatchObject({
        statusCode: 401,
        errorCode: ErrorCodes.UNAUTHORIZED,
      });
    });
  });

  describe('TC-FUNC01-004: 異常系 - 患者が見つからない', () => {
    it('should throw PATIENT_NOT_FOUND error when patient does not exist', async () => {
      // Given
      const patientId = 'P999';
      const token = 'valid-token';

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockCacheManager.get.mockResolvedValue(null);
      mockEMRClient.fetchPatientData.mockRejectedValue(new Error('Patient not found'));

      // When & Then
      await expect(service.getPatientData(patientId, token)).rejects.toMatchObject({
        statusCode: 404,
        errorCode: ErrorCodes.PATIENT_NOT_FOUND,
      });
    });
  });

  describe('TC-FUNC01-005: 異常系 - 電子カルテシステムエラー', () => {
    it('should retry up to 3 times and throw EMR_SYSTEM_ERROR', async () => {
      // Given
      const patientId = 'P001';
      const token = 'valid-token';

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockCacheManager.get.mockResolvedValue(null);
      mockEMRClient.fetchPatientData.mockRejectedValue(new Error('EMR system error'));

      // When & Then
      await expect(service.getPatientData(patientId, token)).rejects.toMatchObject({
        statusCode: 503,
        errorCode: ErrorCodes.EMR_SYSTEM_ERROR,
      });
      expect(mockEMRClient.fetchPatientData).toHaveBeenCalledTimes(3);
    });
  });

  describe('TC-FUNC01-006: 正常系 - キャッシュからデータ取得', () => {
    it('should return data from cache without calling EMR', async () => {
      // Given
      const patientId = 'P001';
      const token = 'valid-token';
      const cachedData: PatientData = {
        patientId: 'P001',
        basicInfo: {
          name: '山田 太郎',
          nameKana: 'ヤマダ タロウ',
          birthDate: '1980-01-01',
          gender: '男性',
          contact: '03-1234-5678',
        },
        admissionInfo: {
          admissionId: 'A001',
          admissionDate: '2024-01-01',
          dischargeDate: '2024-01-15',
          department: '内科',
          attendingPhysician: '佐藤 一郎',
          ward: '3階東病棟',
        },
        diagnoses: [],
        symptoms: '',
        examinations: { bloodTests: [], imagingTests: [] },
        treatments: '',
        nursingRecords: '',
        prescriptions: [],
        guidance: '',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockCacheManager.get.mockResolvedValue(cachedData);

      // When
      const result = await service.getPatientData(patientId, token);

      // Then
      expect(result).toEqual(cachedData);
      expect(mockEMRClient.fetchPatientData).not.toHaveBeenCalled();
      expect(mockCacheManager.get).toHaveBeenCalledWith(`patient:${patientId}`);
    });
  });

  describe('TC-FUNC01-007: 正常系 - 入院ID指定でデータ取得', () => {
    it('should return data with specified admissionId', async () => {
      // Given
      const patientId = 'P001';
      const admissionId = 'A001';
      const token = 'valid-token';
      const mockPatientData: PatientData = {
        patientId: 'P001',
        basicInfo: {
          name: '山田 太郎',
          nameKana: 'ヤマダ タロウ',
          birthDate: '1980-01-01',
          gender: '男性',
          contact: '03-1234-5678',
        },
        admissionInfo: {
          admissionId: 'A001',
          admissionDate: '2024-01-01',
          dischargeDate: '2024-01-15',
          department: '内科',
          attendingPhysician: '佐藤 一郎',
          ward: '3階東病棟',
        },
        diagnoses: [],
        symptoms: '',
        examinations: { bloodTests: [], imagingTests: [] },
        treatments: '',
        nursingRecords: '',
        prescriptions: [],
        guidance: '',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockCacheManager.get.mockResolvedValue(null);
      mockEMRClient.fetchPatientData.mockResolvedValue({} as EMRPatientData);
      mockDataTransformer.transform.mockReturnValue(mockPatientData);
      mockDataValidator.validate.mockReturnValue({ isValid: true, errors: [] });

      // When
      const result = await service.getPatientData(patientId, token, admissionId);

      // Then
      expect(result).toEqual(mockPatientData);
      expect(mockEMRClient.fetchPatientData).toHaveBeenCalledWith(patientId, admissionId);
    });
  });

  describe('TC-FUNC01-008: 異常系 - データ変換エラー', () => {
    it('should throw DATA_CONVERSION_ERROR when transformation fails', async () => {
      // Given
      const patientId = 'P001';
      const token = 'valid-token';

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockCacheManager.get.mockResolvedValue(null);
      mockEMRClient.fetchPatientData.mockResolvedValue({} as EMRPatientData);
      mockDataTransformer.transform.mockImplementation(() => {
        throw new Error('Transformation failed');
      });

      // When & Then
      await expect(service.getPatientData(patientId, token)).rejects.toMatchObject({
        statusCode: 500,
        errorCode: ErrorCodes.DATA_CONVERSION_ERROR,
      });
    });
  });

  describe('TC-FUNC01-009: 異常系 - データ整合性チェックエラー', () => {
    it('should throw DATA_VALIDATION_ERROR when validation fails', async () => {
      // Given
      const patientId = 'P001';
      const token = 'valid-token';
      const mockPatientData: PatientData = {
        patientId: 'P001',
        basicInfo: {
          name: '',
          nameKana: '',
          birthDate: '1980-01-01',
          gender: '男性',
          contact: '',
        },
        admissionInfo: {
          admissionId: 'A001',
          admissionDate: '2024-01-01',
          dischargeDate: '2024-01-15',
          department: '',
          attendingPhysician: '',
          ward: '',
        },
        diagnoses: [],
        symptoms: '',
        examinations: { bloodTests: [], imagingTests: [] },
        treatments: '',
        nursingRecords: '',
        prescriptions: [],
        guidance: '',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockCacheManager.get.mockResolvedValue(null);
      mockEMRClient.fetchPatientData.mockResolvedValue({} as EMRPatientData);
      mockDataTransformer.transform.mockReturnValue(mockPatientData);
      mockDataValidator.validate.mockReturnValue({
        isValid: false,
        errors: ['氏名が必須です', '診療科が必須です'],
      });

      // When & Then
      await expect(service.getPatientData(patientId, token)).rejects.toMatchObject({
        statusCode: 500,
        errorCode: ErrorCodes.DATA_VALIDATION_ERROR,
      });
    });
  });
});

