import { DataTransformer } from '../data-transformer';
import { EMRPatientData, PatientData } from '../../types/patient';

describe('DataTransformer', () => {
  let transformer: DataTransformer;

  beforeEach(() => {
    transformer = new DataTransformer();
  });

  describe('TC-FUNC01-010: 正常系 - データ変換（ID変換）', () => {
    it('should transform EMR patient ID to system patient ID', () => {
      // Given
      const emrData: EMRPatientData = {
        emrPatientId: 'EMR001',
        basicInfo: {
          name: '山田 太郎',
          nameKana: 'ヤマダ タロウ',
          birthDate: '19800101',
          gender: '男性',
          contact: '03-1234-5678',
        },
        admissionInfo: {
          admissionId: 'A001',
          admissionDate: '20240101',
          dischargeDate: '20240115',
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
      const result = transformer.transform(emrData);

      // Then
      expect(result.patientId).toBe('P001'); // IDマッピングテーブルから取得
    });
  });

  describe('TC-FUNC01-011: 正常系 - データ変換（日付変換）', () => {
    it('should transform date from YYYYMMDD to YYYY-MM-DD', () => {
      // Given
      const emrData: EMRPatientData = {
        emrPatientId: 'EMR001',
        basicInfo: {
          name: '山田 太郎',
          nameKana: 'ヤマダ タロウ',
          birthDate: '20240101',
          gender: '男性',
          contact: '03-1234-5678',
        },
        admissionInfo: {
          admissionId: 'A001',
          admissionDate: '20240101',
          dischargeDate: '20240115',
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
      const result = transformer.transform(emrData);

      // Then
      expect(result.basicInfo.birthDate).toBe('2024-01-01');
      expect(result.admissionInfo.admissionDate).toBe('2024-01-01');
      expect(result.admissionInfo.dischargeDate).toBe('2024-01-15');
    });
  });

  describe('TC-FUNC01-012: 正常系 - データ変換（コード変換）', () => {
    it('should transform EMR diagnosis code to ICD-10 code', () => {
      // Given
      const emrData: EMRPatientData = {
        emrPatientId: 'EMR001',
        basicInfo: {
          name: '山田 太郎',
          nameKana: 'ヤマダ タロウ',
          birthDate: '19800101',
          gender: '男性',
          contact: '03-1234-5678',
        },
        admissionInfo: {
          admissionId: 'A001',
          admissionDate: '20240101',
          dischargeDate: '20240115',
          department: '内科',
          attendingPhysician: '佐藤 一郎',
          ward: '3階東病棟',
        },
        diagnoses: [
          {
            emrCode: 'HT001',
            name: '本態性高血圧症',
            type: 'primary',
          },
        ],
        symptoms: '',
        examinations: { bloodTests: [], imagingTests: [] },
        treatments: '',
        nursingRecords: '',
        prescriptions: [],
        guidance: '',
      };

      // When
      const result = transformer.transform(emrData);

      // Then
      expect(result.diagnoses[0].code).toBe('I10'); // コード変換テーブルから取得
      expect(result.diagnoses[0].name).toBe('本態性高血圧症');
      expect(result.diagnoses[0].type).toBe('primary');
    });
  });
});

