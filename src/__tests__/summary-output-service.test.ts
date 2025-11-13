import { SummaryOutputService } from '../services/summary-output-service';
import { SummaryRepository } from '../repositories/summary-repository';
import { Summary } from '../types/summary';
import { ErrorCodes } from '../types/errors';

jest.mock('../repositories/summary-repository');

describe('SummaryOutputService', () => {
  let service: SummaryOutputService;
  let mockSummaryRepository: jest.Mocked<SummaryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSummaryRepository = new SummaryRepository() as jest.Mocked<SummaryRepository>;
    service = new SummaryOutputService(mockSummaryRepository);
  });

  describe('TC-FUNC05-001: 正常系 - PDF生成成功', () => {
    it('should generate PDF successfully', async () => {
      // Given
      const summaryId = 'S001';
      const request = { outputFormat: 'PDF' as const };

      const mockSummary: Summary = {
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'approved',
        content: '<html>Summary content</html>',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
      };

      mockSummaryRepository.findById.mockResolvedValue(mockSummary);

      // When
      const result = await service.generateOutput(summaryId, request);

      // Then
      expect(result.summaryId).toBe(summaryId);
      expect(result.pdfUrl).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(result.fileSize).toBeDefined();
    });
  });

  describe('TC-FUNC05-002: 異常系 - サマリー未存在', () => {
    it('should throw error when summary does not exist', async () => {
      // Given
      const summaryId = 'S999';
      const request = { outputFormat: 'PDF' as const };

      mockSummaryRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.generateOutput(summaryId, request)).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'SUMMARY_NOT_FOUND',
      });
    });
  });

  describe('TC-FUNC05-005: 正常系 - 印刷処理', () => {
    it('should generate print data successfully', async () => {
      // Given
      const summaryId = 'S001';
      const request = { outputFormat: 'PRINT' as const };

      const mockSummary: Summary = {
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'approved',
        content: '<html>Summary content</html>',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
      };

      mockSummaryRepository.findById.mockResolvedValue(mockSummary);

      // When
      const result = await service.generateOutput(summaryId, request);

      // Then
      expect(result.summaryId).toBe(summaryId);
      expect(result.printData).toBe(mockSummary.content);
    });
  });
});

