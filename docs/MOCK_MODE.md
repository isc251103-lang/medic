# EMRClient モックモード

## 概要

EMRClientは、開発環境やテスト環境で実際の電子カルテシステムに接続せずに動作確認できるよう、モックモードをサポートしています。

## モックモードの有効化

`.env`ファイルで以下の環境変数を設定します：

```env
EMR_MOCK_MODE=true
```

または、`NODE_ENV=development`の場合も自動的にモックモードが有効になります。

## モックデータ

モックモードが有効な場合、以下のモックデータが返されます：

### 正常系

**患者ID**: `P001`（その他の有効なID）

```json
{
  "emrPatientId": "P001",
  "basicInfo": {
    "name": "山田 太郎",
    "nameKana": "ヤマダ タロウ",
    "birthDate": "19800101",
    "gender": "男性",
    "contact": "03-1234-5678"
  },
  "admissionInfo": {
    "admissionId": "A001",
    "admissionDate": "20240101",
    "dischargeDate": "20240115",
    "department": "内科",
    "attendingPhysician": "佐藤 一郎",
    "ward": "3階東病棟"
  },
  "diagnoses": [
    {
      "emrCode": "HT001",
      "name": "本態性高血圧症",
      "type": "primary"
    }
  ],
  "symptoms": "頭痛、めまい",
  "examinations": {
    "bloodTests": [
      {
        "name": "血圧",
        "value": "140/90",
        "unit": "mmHg",
        "date": "2024-01-01"
      }
    ],
    "imagingTests": []
  },
  "treatments": "降圧薬を処方し、経過観察を行った。",
  "nursingRecords": "特に問題なし。",
  "prescriptions": [
    {
      "medicineName": "アムロジピン",
      "dosage": "5mg",
      "frequency": "1日1回"
    }
  ],
  "guidance": "塩分制限、適度な運動を心がけること。"
}
```

### 異常系

以下の患者IDを使用すると、エラーが発生します：

- **`P999`**: 患者が見つからないエラー（404相当）
- **`EMR_ERROR`**: 電子カルテシステムエラー（503相当）
- **`INVALID_FORMAT`**: 不正なデータ形式（データ変換エラーを誘発）

## 使用例

### 開発環境での使用

```bash
# .envファイルに設定
EMR_MOCK_MODE=true

# サーバー起動
npm run dev
```

### テスト環境での使用

テストコードでは、Jestのモック機能を使用します：

```typescript
jest.mock('../modules/emr-client');

const mockEMRClient = new EMRClient() as jest.Mocked<EMRClient>;
mockEMRClient.fetchPatientData.mockResolvedValue(mockData);
```

## 本番環境での注意事項

本番環境では、必ず`EMR_MOCK_MODE=false`に設定するか、環境変数を削除してください。モックモードが有効なまま本番環境にデプロイされると、実際の電子カルテシステムに接続されません。

## ネットワーク遅延のシミュレーション

モックモードでは、実際のAPI呼び出しと同様の挙動を再現するため、100msの遅延をシミュレートしています。

