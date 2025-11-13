import { DataValidator } from '../data-validator';
import { PatientData } from '../../types/patient';

describe('DataValidator', () => {
  let validator: DataValidator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('必須項目チェック', () => {
    it('should return valid when all required fields are present', () => {
      // Given
      const patientData: PatientData = {
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

      // When
      const result = validator.validate(patientData);

      // Then
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when patientId is missing', () => {
      // Given
      const patientData: PatientData = {
        patientId: '',
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

      // When
      const result = validator.validate(patientData);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('患者IDが必須です');
    });

    it('should return error when name is missing', () => {
      // Given
      const patientData: PatientData = {
        patientId: 'P001',
        basicInfo: {
          name: '',
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

      // When
      const result = validator.validate(patientData);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('氏名が必須です');
    });

    it('should return error when department is missing', () => {
      // Given
      const patientData: PatientData = {
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
          department: '',
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

      // When
      const result = validator.validate(patientData);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('診療科が必須です');
    });

    it('should return error when admission date is after discharge date', () => {
      // Given
      const patientData: PatientData = {
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
          admissionDate: '2024-01-15',
          dischargeDate: '2024-01-01',
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

      // When
      const result = validator.validate(patientData);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('入院日は退院日より前である必要があります');
    });
  });
});

