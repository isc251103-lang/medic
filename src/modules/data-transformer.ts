import { PatientData, EMRPatientData } from '../types/patient';

// IDマッピングテーブル（実際の実装ではデータベースから取得）
const ID_MAPPING: Record<string, string> = {
  'EMR001': 'P001',
  'EMR002': 'P002',
};

// コード変換テーブル（実際の実装ではデータベースから取得）
const CODE_MAPPING: Record<string, string> = {
  'HT001': 'I10', // 本態性高血圧症
  'DM001': 'E11', // 2型糖尿病
};

export class DataTransformer {
  transform(emrData: EMRPatientData): PatientData {
    // ID変換
    const systemPatientId = this.transformId(emrData.emrPatientId);

    // 日付変換
    const birthDate = this.transformDate(emrData.basicInfo.birthDate);
    const admissionDate = this.transformDate(emrData.admissionInfo.admissionDate);
    const dischargeDate = this.transformDate(emrData.admissionInfo.dischargeDate);

    // コード変換
    const diagnoses = emrData.diagnoses.map((diagnosis) => ({
      code: this.transformCode(diagnosis.emrCode),
      name: diagnosis.name,
      type: diagnosis.type === 'primary' ? 'primary' as const : 'secondary' as const,
    }));

    return {
      patientId: systemPatientId,
      basicInfo: {
        name: emrData.basicInfo.name,
        nameKana: emrData.basicInfo.nameKana,
        birthDate,
        gender: emrData.basicInfo.gender,
        contact: emrData.basicInfo.contact,
      },
      admissionInfo: {
        admissionId: emrData.admissionInfo.admissionId,
        admissionDate,
        dischargeDate,
        department: emrData.admissionInfo.department,
        attendingPhysician: emrData.admissionInfo.attendingPhysician,
        ward: emrData.admissionInfo.ward,
      },
      diagnoses,
      symptoms: emrData.symptoms,
      examinations: emrData.examinations,
      treatments: emrData.treatments,
      nursingRecords: emrData.nursingRecords,
      prescriptions: emrData.prescriptions,
      guidance: emrData.guidance,
    };
  }

  private transformId(emrId: string): string {
    // IDマッピングテーブルを参照
    if (ID_MAPPING[emrId]) {
      return ID_MAPPING[emrId];
    }
    // 存在しない場合は新規作成（実際の実装ではデータベースに保存）
    const newId = `P${String(Object.keys(ID_MAPPING).length + 1).padStart(3, '0')}`;
    ID_MAPPING[emrId] = newId;
    return newId;
  }

  private transformDate(emrDate: string): string {
    // YYYYMMDD -> YYYY-MM-DD
    if (emrDate.length !== 8) {
      throw new Error(`Invalid date format: ${emrDate}`);
    }
    const year = emrDate.substring(0, 4);
    const month = emrDate.substring(4, 6);
    const day = emrDate.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  private transformCode(emrCode: string): string {
    // コード変換テーブルを参照
    if (CODE_MAPPING[emrCode]) {
      return CODE_MAPPING[emrCode];
    }
    // マッピングがない場合は元のコードを返す（実際の実装ではエラー処理を検討）
    return emrCode;
  }
}
