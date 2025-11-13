import { SummaryApprovalService } from '../services/summary-approval-service';
import { SummaryRepository } from '../repositories/summary-repository';
import { AuthModule } from '../modules/auth-module';
import { EMRClient } from '../modules/emr-client';
import { Summary } from '../types/summary';
import { ErrorCodes } from '../types/errors';

jest.mock('../repositories/summary-repository');
jest.mock('../modules/auth-module');
jest.mock('../modules/emr-client');

describe('SummaryApprovalService', () => {
  let service: SummaryApprovalService;
  let mockSummaryRepository: jest.Mocked<SummaryRepository>;
  let mockAuthModule: jest.Mocked<AuthModule>;
  let mockEMRClient: jest.Mocked<EMRClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSummaryRepository = new SummaryRepository() as jest.Mocked<SummaryRepository>;
    mockAuthModule = new AuthModule() as jest.Mocked<AuthModule>;
    mockEMRClient = new EMRClient() as jest.Mocked<EMRClient>;

    service = new SummaryApprovalService(
      mockSummaryRepository,
      mockAuthModule,
      mockEMRClient
    );
  });

  describe('TC-FUNC04-001: 正常系 - 承認成功', () => {
    it('should approve summary successfully', async () => {
      // Given
      const summaryId = 'S001';
      const token = 'valid-token';
      const userId = 'user001';

      const mockSummary: Summary = {
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'draft',
        content: '<html><h2>患者基本情報</h2><h2>主病名</h2><h2>治療経過</h2></html>',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
      };

      const approvedSummary: Summary = {
        ...mockSummary,
        status: 'approved',
        updatedBy: userId,
      };

      const sentSummary: Summary = {
        ...approvedSummary,
        status: 'sent',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockSummaryRepository.findById.mockResolvedValue(mockSummary);
      mockSummaryRepository.update
        .mockResolvedValueOnce(approvedSummary)
        .mockResolvedValueOnce(sentSummary);

      // When
      const result = await service.approveSummary(summaryId, token, userId);

      // Then
      expect(result.status).toBe('sent');
      expect(mockSummaryRepository.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('TC-FUNC04-003: 異常系 - 必須項目不足', () => {
    it('should throw error when required fields are missing', async () => {
      // Given
      const summaryId = 'S001';
      const token = 'valid-token';
      const userId = 'user001';

      const mockSummary: Summary = {
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'draft',
        content: '<html>Incomplete content</html>', // 必須セクションが不足
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockSummaryRepository.findById.mockResolvedValue(mockSummary);

      // When & Then
      await expect(service.approveSummary(summaryId, token, userId)).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'REQUIRED_FIELD_MISSING',
      });
    });
  });

  describe('TC-FUNC04-005: 異常系 - 承認権限なし', () => {
    it('should throw error when user does not have approval permission', async () => {
      // Given
      const summaryId = 'S001';
      const token = 'valid-token';
      const userId = 'user001';

      const mockSummary: Summary = {
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'draft',
        content: '<html><h2>患者基本情報</h2><h2>主病名</h2><h2>治療経過</h2></html>',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(false);
      mockSummaryRepository.findById.mockResolvedValue(mockSummary);

      // When & Then
      await expect(service.approveSummary(summaryId, token, userId)).rejects.toMatchObject({
        statusCode: 403,
        errorCode: 'APPROVAL_PERMISSION_DENIED',
      });
    });
  });

  describe('TC-FUNC04-006: 異常系 - 既に承認済み', () => {
    it('should throw error when summary is already approved', async () => {
      // Given
      const summaryId = 'S001';
      const token = 'valid-token';
      const userId = 'user001';

      const mockSummary: Summary = {
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'approved',
        content: '<html><h2>患者基本情報</h2><h2>主病名</h2><h2>治療経過</h2></html>',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockSummaryRepository.findById.mockResolvedValue(mockSummary);

      // When & Then
      await expect(service.approveSummary(summaryId, token, userId)).rejects.toMatchObject({
        statusCode: 409,
        errorCode: 'ALREADY_APPROVED',
      });
    });
  });
});

