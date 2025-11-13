import { SummaryGenerationService } from '../services/summary-generation-service';
import { PatientDataService } from '../services/patient-data-service';
import { TemplateEngine } from '../modules/template-engine';
import { LLMEngine } from '../modules/llm-engine';
import { ContentFormatter } from '../modules/content-formatter';
import { SummaryRepository } from '../repositories/summary-repository';
import { GenerateSummaryRequest } from '../types/summary';
import { PatientData } from '../types/patient';
import { ErrorCodes } from '../types/errors';

jest.mock('../services/patient-data-service');
jest.mock('../modules/template-engine');
jest.mock('../modules/llm-engine');
jest.mock('../modules/content-formatter');
jest.mock('../repositories/summary-repository');

describe('SummaryGenerationService', () => {
  let service: SummaryGenerationService;
  let mockPatientDataService: jest.Mocked<PatientDataService>;
  let mockTemplateEngine: jest.Mocked<TemplateEngine>;
  let mockLLMEngine: jest.Mocked<LLMEngine>;
  let mockContentFormatter: jest.Mocked<ContentFormatter>;
  let mockSummaryRepository: jest.Mocked<SummaryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPatientDataService = new PatientDataService(
      {} as any, {} as any, {} as any, {} as any, {} as any
    ) as jest.Mocked<PatientDataService>;
    mockTemplateEngine = new TemplateEngine() as jest.Mocked<TemplateEngine>;
    mockLLMEngine = new LLMEngine() as jest.Mocked<LLMEngine>;
    mockContentFormatter = new ContentFormatter() as jest.Mocked<ContentFormatter>;
    mockSummaryRepository = new SummaryRepository() as jest.Mocked<SummaryRepository>;

    service = new SummaryGenerationService(
      mockPatientDataService,
      mockTemplateEngine,
      mockLLMEngine,
      mockContentFormatter,
      mockSummaryRepository
    );
  });

  describe('TC-FUNC02-001: 正常系 - サマリー生成成功', () => {
    it('should generate summary successfully', async () => {
      // Given
      const request: GenerateSummaryRequest = {
        patientId: 'P001',
        admissionId: 'A001',
      };
      const token = 'valid-token';
      const userId = 'user001';

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

      const mockTemplate = { version: '1.0', sections: [] };
      const mockPrompt = 'template applied';
      const mockLLMResponse = { text: 'Generated summary text', tokensUsed: 100 };
      const mockHTML = '<html>Generated summary</html>';

      mockPatientDataService.getPatientData.mockResolvedValue(mockPatientData);
      mockTemplateEngine.loadTemplate.mockResolvedValue(mockTemplate as any);
      mockTemplateEngine.applyTemplate.mockReturnValue(mockPrompt);
      mockLLMEngine.generate.mockResolvedValue(mockLLMResponse);
      mockContentFormatter.formatToHTML.mockReturnValue(mockHTML);
      mockContentFormatter.validateContent.mockReturnValue({ isValid: true, errors: [] });
      mockSummaryRepository.save.mockResolvedValue({
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'draft',
        content: mockHTML,
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: userId,
      });

      // When
      const result = await service.generateSummary(request, token, userId);

      // Then
      expect(result.summaryId).toBeDefined();
      expect(result.status).toBe('draft');
      expect(result.content).toBe(mockHTML);
      expect(mockPatientDataService.getPatientData).toHaveBeenCalledWith('P001', token, 'A001');
      expect(mockTemplateEngine.loadTemplate).toHaveBeenCalledWith('1.0');
      expect(mockLLMEngine.generate).toHaveBeenCalled();
      expect(mockContentFormatter.formatToHTML).toHaveBeenCalledWith(mockLLMResponse.text);
      expect(mockSummaryRepository.save).toHaveBeenCalled();
    });
  });

  describe('TC-FUNC02-002: 異常系 - 患者IDが無効', () => {
    it('should throw error when patientId is empty', async () => {
      // Given
      const request: GenerateSummaryRequest = {
        patientId: '',
        admissionId: 'A001',
      };
      const token = 'valid-token';
      const userId = 'user001';

      // When & Then
      await expect(service.generateSummary(request, token, userId)).rejects.toMatchObject({
        statusCode: 400,
        errorCode: ErrorCodes.INVALID_REQUEST,
      });
    });
  });

  describe('TC-FUNC02-003: 異常系 - カルテデータ取得エラー', () => {
    it('should throw error when patient data fetch fails', async () => {
      // Given
      const request: GenerateSummaryRequest = {
        patientId: 'P001',
        admissionId: 'A001',
      };
      const token = 'valid-token';
      const userId = 'user001';

      mockPatientDataService.getPatientData.mockRejectedValue(
        new Error('Patient data fetch failed')
      );

      // When & Then
      await expect(service.generateSummary(request, token, userId)).rejects.toMatchObject({
        statusCode: 500,
        errorCode: 'DATA_FETCH_ERROR',
      });
    });
  });

  describe('TC-FUNC02-004: 異常系 - LLM生成エラー', () => {
    it('should throw error when LLM generation fails', async () => {
      // Given
      const request: GenerateSummaryRequest = {
        patientId: 'P001',
        admissionId: 'A001',
      };
      const token = 'valid-token';
      const userId = 'user001';

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

      mockPatientDataService.getPatientData.mockResolvedValue(mockPatientData);
      mockTemplateEngine.loadTemplate.mockResolvedValue({ version: '1.0', sections: [] } as any);
      mockTemplateEngine.applyTemplate.mockReturnValue('template applied');
      mockLLMEngine.generate.mockRejectedValue(new Error('LLM generation failed'));

      // When & Then
      await expect(service.generateSummary(request, token, userId)).rejects.toMatchObject({
        statusCode: 500,
        errorCode: 'GENERATION_ERROR',
      });
    });
  });

  describe('TC-FUNC02-007: 正常系 - 看護記録を含まない生成', () => {
    it('should generate summary without nursing records when includeNursingRecords is false', async () => {
      // Given
      const request: GenerateSummaryRequest = {
        patientId: 'P001',
        admissionId: 'A001',
        options: {
          includeNursingRecords: false,
        },
      };
      const token = 'valid-token';
      const userId = 'user001';

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
        nursingRecords: '看護記録',
        prescriptions: [],
        guidance: '',
      };

      mockPatientDataService.getPatientData.mockResolvedValue(mockPatientData);
      mockTemplateEngine.loadTemplate.mockResolvedValue({ version: '1.0', sections: [] } as any);
      mockTemplateEngine.applyTemplate.mockReturnValue('template applied');
      mockLLMEngine.generate.mockResolvedValue({ text: 'Generated text', tokensUsed: 100 });
      mockContentFormatter.formatToHTML.mockReturnValue('<html>Summary</html>');
      mockContentFormatter.validateContent.mockReturnValue({ isValid: true, errors: [] });
      mockSummaryRepository.save.mockResolvedValue({
        summaryId: 'S001',
        patientId: 'P001',
        admissionId: 'A001',
        status: 'draft',
        content: '<html>Summary</html>',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: userId,
      });

      // When
      await service.generateSummary(request, token, userId);

      // Then
      expect(mockTemplateEngine.applyTemplate).toHaveBeenCalledWith(
        expect.anything(),
        mockPatientData,
        { includeNursingRecords: false }
      );
    });
  });
});

