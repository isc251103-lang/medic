import { PatientData } from '../types/patient';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class DataValidator {
  validate(patientData: PatientData): ValidationResult {
    const errors: string[] = [];

    // 必須項目チェック
    if (!patientData.patientId || patientData.patientId.trim().length === 0) {
      errors.push('患者IDが必須です');
    } else if (patientData.patientId.length > 20) {
      errors.push('患者IDは20文字以内で指定してください');
    }

    // 患者基本情報チェック
    if (!patientData.basicInfo.name || patientData.basicInfo.name.trim().length === 0) {
      errors.push('氏名が必須です');
    } else if (patientData.basicInfo.name.length > 100) {
      errors.push('氏名は100文字以内で指定してください');
    }

    if (!patientData.basicInfo.birthDate) {
      errors.push('生年月日が必須です');
    } else if (!this.isValidDate(patientData.basicInfo.birthDate)) {
      errors.push('生年月日の形式が不正です');
    }

    if (!patientData.basicInfo.gender) {
      errors.push('性別が必須です');
    } else if (!['男性', '女性', 'その他'].includes(patientData.basicInfo.gender)) {
      errors.push('性別は「男性」「女性」「その他」のいずれかを指定してください');
    }

    // 入院情報チェック
    if (!patientData.admissionInfo.admissionDate) {
      errors.push('入院日が必須です');
    } else if (!this.isValidDate(patientData.admissionInfo.admissionDate)) {
      errors.push('入院日の形式が不正です');
    }

    if (!patientData.admissionInfo.department || patientData.admissionInfo.department.trim().length === 0) {
      errors.push('診療科が必須です');
    }

    if (!patientData.admissionInfo.attendingPhysician || patientData.admissionInfo.attendingPhysician.trim().length === 0) {
      errors.push('主治医が必須です');
    }

    // 日付整合性チェック
    if (patientData.admissionInfo.admissionDate && patientData.admissionInfo.dischargeDate) {
      const admission = new Date(patientData.admissionInfo.admissionDate);
      const discharge = new Date(patientData.admissionInfo.dischargeDate);
      if (admission > discharge) {
        errors.push('入院日は退院日より前である必要があります');
      }
    }

    // 病名コードチェック
    for (const diagnosis of patientData.diagnoses) {
      if (diagnosis.code && !this.isValidICD10Code(diagnosis.code)) {
        errors.push(`病名コード「${diagnosis.code}」が無効です`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private isValidICD10Code(code: string): boolean {
    // ICD-10コードの簡易チェック（実際の実装ではより厳密な検証が必要）
    const regex = /^[A-Z]\d{2}(\.\d{1,2})?$/;
    return regex.test(code);
  }
}
