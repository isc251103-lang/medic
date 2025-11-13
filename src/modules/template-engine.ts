import { PatientData } from '../types/patient';

export interface Template {
  version: string;
  sections: TemplateSection[];
}

export interface TemplateSection {
  name: string;
  required: boolean;
  template: string;
}

export class TemplateEngine {
  private templates: Map<string, Template> = new Map();

  constructor() {
    // デフォルトテンプレートを初期化
    this.templates.set('1.0', {
      version: '1.0',
      sections: [
        {
          name: '患者基本情報',
          required: true,
          template: '## 患者基本情報\n- 氏名: {{patient.name}}\n- 生年月日: {{patient.birthDate}}\n- 性別: {{patient.gender}}',
        },
        {
          name: '入院・退院情報',
          required: true,
          template: '## 入院・退院情報\n- 入院日: {{admission.admissionDate}}\n- 退院日: {{admission.dischargeDate}}\n- 診療科: {{admission.department}}\n- 主治医: {{admission.attendingPhysician}}',
        },
        {
          name: '病名',
          required: true,
          template: '## 主病名・副病名\n{{#each diagnoses}}- {{code}}: {{name}} ({{type}})\n{{/each}}',
        },
        {
          name: '症状・所見',
          required: true,
          template: '## 入院時現症\n{{symptoms}}',
        },
        {
          name: '検査所見',
          required: true,
          template: '## 検査所見\n{{examinations}}',
        },
        {
          name: '治療経過',
          required: true,
          template: '## 治療経過\n{{treatments}}',
        },
        {
          name: '処方',
          required: true,
          template: '## 退院時処方\n{{#each prescriptions}}- {{medicineName}}: {{dosage}}, {{frequency}}\n{{/each}}',
        },
        {
          name: '療養指導',
          required: true,
          template: '## 退院後の療養指導\n{{guidance}}',
        },
        {
          name: '看護記録',
          required: false,
          template: '{{#if includeNursingRecords}}## 看護記録\n{{nursingRecords}}\n{{/if}}',
        },
      ],
    });
  }

  async loadTemplate(version: string = '1.0'): Promise<Template> {
    const template = this.templates.get(version);
    if (!template) {
      // バージョンが見つからない場合はデフォルトを使用
      return this.templates.get('1.0')!;
    }
    return template;
  }

  applyTemplate(template: Template, data: PatientData, options?: { includeNursingRecords?: boolean }): string {
    let prompt = 'あなたは医療文書作成の専門家です。以下の患者情報を基に、退院時サマリーを作成してください。\n\n';

    // 患者基本情報
    prompt += `患者情報:\n`;
    prompt += `- 氏名: ${data.basicInfo.name}\n`;
    prompt += `- 生年月日: ${data.basicInfo.birthDate}\n`;
    prompt += `- 性別: ${data.basicInfo.gender}\n\n`;

    // 入院情報
    prompt += `入院情報:\n`;
    prompt += `- 入院日: ${data.admissionInfo.admissionDate}\n`;
    prompt += `- 退院日: ${data.admissionInfo.dischargeDate}\n`;
    prompt += `- 診療科: ${data.admissionInfo.department}\n`;
    prompt += `- 主治医: ${data.admissionInfo.attendingPhysician}\n\n`;

    // 病名
    prompt += `病名:\n`;
    data.diagnoses.forEach((diagnosis) => {
      prompt += `- ${diagnosis.name} (${diagnosis.code})\n`;
    });
    prompt += '\n';

    // 症状・所見
    prompt += `症状・所見:\n${data.symptoms}\n\n`;

    // 検査結果
    prompt += `検査結果:\n${JSON.stringify(data.examinations)}\n\n`;

    // 治療経過
    prompt += `治療経過:\n${data.treatments}\n\n`;

    // 処方
    prompt += `処方:\n`;
    data.prescriptions.forEach((prescription) => {
      prompt += `- ${prescription.medicineName}: ${prescription.dosage}, ${prescription.frequency}\n`;
    });
    prompt += '\n';

    // 療養指導
    prompt += `療養指導:\n${data.guidance}\n\n`;

    // 看護記録（オプション）
    if (options?.includeNursingRecords !== false && data.nursingRecords) {
      prompt += `看護記録:\n${data.nursingRecords}\n\n`;
    }

    prompt += '上記の情報を基に、医療従事者が読みやすい形式で退院時サマリーを作成してください。\n';
    prompt += '専門用語は適切に使用し、患者の状態と治療内容を正確に記載してください。';

    return prompt;
  }
}
