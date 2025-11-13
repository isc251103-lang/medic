export interface BasicInfo {
  name: string;
  nameKana: string;
  birthDate: string; // YYYY-MM-DD
  gender: string;
  contact: string;
}

export interface AdmissionInfo {
  admissionId: string;
  admissionDate: string; // YYYY-MM-DD
  dischargeDate: string; // YYYY-MM-DD
  department: string;
  attendingPhysician: string;
  ward: string;
}

export interface Diagnosis {
  code: string; // ICD-10
  name: string;
  type: 'primary' | 'secondary';
}

export interface BloodTest {
  name: string;
  value: string;
  unit: string;
  date: string;
}

export interface ImagingTest {
  type: string;
  findings: string;
  date: string;
}

export interface Examinations {
  bloodTests: BloodTest[];
  imagingTests: ImagingTest[];
}

export interface Prescription {
  medicineName: string;
  dosage: string;
  frequency: string;
}

export interface PatientData {
  patientId: string;
  basicInfo: BasicInfo;
  admissionInfo: AdmissionInfo;
  diagnoses: Diagnosis[];
  symptoms: string;
  examinations: Examinations;
  treatments: string;
  nursingRecords: string;
  prescriptions: Prescription[];
  guidance: string;
}

// EMRシステムから取得する生データ
export interface EMRPatientData {
  emrPatientId: string;
  basicInfo: {
    name: string;
    nameKana: string;
    birthDate: string; // YYYYMMDD
    gender: string;
    contact: string;
  };
  admissionInfo: {
    admissionId: string;
    admissionDate: string; // YYYYMMDD
    dischargeDate: string; // YYYYMMDD
    department: string;
    attendingPhysician: string;
    ward: string;
  };
  diagnoses: Array<{
    emrCode: string;
    name: string;
    type: string;
  }>;
  symptoms: string;
  examinations: {
    bloodTests: BloodTest[];
    imagingTests: ImagingTest[];
  };
  treatments: string;
  nursingRecords: string;
  prescriptions: Prescription[];
  guidance: string;
}

