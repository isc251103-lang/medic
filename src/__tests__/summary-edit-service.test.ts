import { SummaryEditService } from '../services/summary-edit-service';
import { SummaryRepository } from '../repositories/summary-repository';
import { AuthModule } from '../modules/auth-module';
import { ContentFormatter } from '../modules/content-formatter';
import { Summary } from '../types/summary';
import { ErrorCodes } from '../types/errors';

jest.mock('../repositories/summary-repository');
jest.mock('../modules/auth-module');
jest.mock('../modules/content-formatter');

describe('SummaryEditService', () => {
  let service: SummaryEditService;
  let mockSummaryRepository: jest.Mocked<SummaryRepository>;
  let mockAuthModule: jest.Mocked<AuthModule>;
  let mockContentFormatter: jest.Mocked<ContentFormatter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSummaryRepository = new SummaryRepository() as jest.Mocked<SummaryRepository>;
    mockAuthModule = new AuthModule() as jest.Mocked<AuthModule>;
    mockContentFormatter = new ContentFormatter() as jest.Mocked<ContentFormatter>;

    service = new SummaryEditService(
      mockSummaryRepository,
      mockAuthModule,
      mockContentFormatter
    );
  });

  describe('TC-FUNC03-001: 正常系 - サマリー取得成功', () => {
    it('should return summary successfully', async () => {
      // Given
      const summaryId = 'S001';
      const token = 'valid-token';
      const mockSummary: Summary = {
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'draft',
        content: '<html>Summary content</html>',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockSummaryRepository.findById.mockResolvedValue(mockSummary);

      // When
      const result = await service.getSummary(summaryId, token);

      // Then
      expect(result).toEqual(mockSummary);
      expect(mockAuthModule.verifyToken).toHaveBeenCalledWith(token);
      expect(mockAuthModule.checkPermission).toHaveBeenCalledWith(token, 'P001');
    });
  });

  describe('TC-FUNC03-002: 異常系 - サマリー未存在', () => {
    it('should throw error when summary does not exist', async () => {
      // Given
      const summaryId = 'S999';
      const token = 'valid-token';

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockSummaryRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.getSummary(summaryId, token)).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'SUMMARY_NOT_FOUND',
      });
    });
  });

  describe('TC-FUNC03-003: 異常系 - 編集権限なし', () => {
    it('should throw error when user does not have edit permission', async () => {
      // Given
      const summaryId = 'S001';
      const token = 'valid-token';
      const mockSummary: Summary = {
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'draft',
        content: '<html>Summary content</html>',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(false);
      mockSummaryRepository.findById.mockResolvedValue(mockSummary);

      // When & Then
      await expect(service.getSummary(summaryId, token)).rejects.toMatchObject({
        statusCode: 403,
        errorCode: 'EDIT_PERMISSION_DENIED',
      });
    });
  });

  describe('TC-FUNC03-004: 正常系 - サマリー更新成功', () => {
    it('should update summary successfully', async () => {
      // Given
      const summaryId = 'S001';
      const token = 'valid-token';
      const userId = 'user001';
      const request = {
        content: '<html>Updated content</html>',
      };

      const existingSummary: Summary = {
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'draft',
        content: '<html>Original content</html>',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
      };

      const updatedSummary: Summary = {
        ...existingSummary,
        content: request.content,
        version: 2,
        updatedBy: userId,
        updatedAt: '2024-01-15T11:00:00Z',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockSummaryRepository.findById.mockResolvedValue(existingSummary);
      mockContentFormatter.validateContent.mockReturnValue({ isValid: true, errors: [] });
      mockSummaryRepository.update.mockResolvedValue(updatedSummary);

      // When
      const result = await service.updateSummary(summaryId, request, token, userId);

      // Then
      expect(result.version).toBe(2);
      expect(result.content).toBe(request.content);
      expect(mockContentFormatter.validateContent).toHaveBeenCalledWith(request.content);
      expect(mockSummaryRepository.update).toHaveBeenCalledWith(summaryId, {
        content: request.content,
        version: 2,
        updatedBy: userId,
      });
    });
  });

  describe('TC-FUNC03-005: 異常系 - バリデーションエラー', () => {
    it('should throw error when validation fails', async () => {
      // Given
      const summaryId = 'S001';
      const token = 'valid-token';
      const userId = 'user001';
      const request = {
        content: '<script>alert("XSS")</script>',
      };

      const existingSummary: Summary = {
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'draft',
        content: '<html>Original content</html>',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
      };

      mockAuthModule.verifyToken.mockResolvedValue(true);
      mockAuthModule.checkPermission.mockResolvedValue(true);
      mockSummaryRepository.findById.mockResolvedValue(existingSummary);
      mockContentFormatter.validateContent.mockReturnValue({
        isValid: false,
        errors: ['不正なスクリプトが検出されました'],
      });

      // When & Then
      await expect(service.updateSummary(summaryId, request, token, userId)).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
      });
    });
  });
});

