import axios, { AxiosInstance } from 'axios';
import { EMRPatientData } from '../types/patient';

export class EMRClient {
  private client: AxiosInstance | null = null;
  private mockMode: boolean;

  constructor() {
    // 環境変数でモックモードを切り替え
    this.mockMode = process.env.EMR_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';
    
    if (!this.mockMode) {
      const emrBaseUrl = process.env.EMR_BASE_URL || 'http://localhost:3001';
      this.client = axios.create({
        baseURL: emrBaseUrl,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }

  async fetchPatientData(patientId: string, admissionId?: string): Promise<EMRPatientData> {
    // モックモードの場合
    if (this.mockMode) {
      return this.fetchMockPatientData(patientId, admissionId);
    }

    // 実際のAPI呼び出し
    try {
      const url = admissionId
        ? `/api/patients/${patientId}?admissionId=${admissionId}`
        : `/api/patients/${patientId}`;

      const response = await this.client!.get<EMRPatientData>(url);

      if (response.status === 404) {
        throw new Error('Patient not found');
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Patient not found');
      }
      throw new Error(`EMR system error: ${error.message}`);
    }
  }

  /**
   * モックデータを返す
   */
  private async fetchMockPatientData(patientId: string, admissionId?: string): Promise<EMRPatientData> {
    // ネットワーク遅延をシミュレート
    await this.delay(100);

    // エラーケースのシミュレーション
    if (patientId === 'P999') {
      throw new Error('Patient not found in EMR');
    }

    if (patientId === 'EMR_ERROR') {
      throw new Error('EMR System Error');
    }

    if (patientId === 'INVALID_FORMAT') {
      return { invalid: 'data' } as any;
    }

    // 正常なモックデータを返す
    const mockData: EMRPatientData = {
      emrPatientId: patientId,
      basicInfo: {
        name: '山田 太郎',
        nameKana: 'ヤマダ タロウ',
        birthDate: '19800101',
        gender: '男性',
        contact: '03-1234-5678',
      },
      admissionInfo: {
        admissionId: admissionId || 'A001',
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
      symptoms: '頭痛、めまい',
      examinations: {
        bloodTests: [
          {
            name: '血圧',
            value: '140/90',
            unit: 'mmHg',
            date: '2024-01-01',
          },
        ],
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

    return mockData;
  }

  /**
   * 遅延をシミュレート
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
