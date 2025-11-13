# API動作確認ガイド

## 前提条件

- サーバーが起動している（`npm run dev`）
- モックモードが有効（`EMR_MOCK_MODE=true`）

## 1. ヘルスチェック

### PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
```

### curl（Git Bash / Linux / Mac）

```bash
curl http://localhost:3000/health
```

**期待されるレスポンス:**
```json
{
  "status": "ok"
}
```

## 2. テスト用トークンの生成

```bash
npm run token
```

このコマンドで生成されたトークンをコピーして、以下のAPIリクエストで使用します。

## 3. 患者データ取得API

### PowerShell

```powershell
# トークンを変数に設定
$token = "YOUR_TOKEN_HERE"

# ヘッダーを設定
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 患者データを取得
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/P001" -Method Get -Headers $headers | ConvertTo-Json -Depth 10
```

### curl（Git Bash / Linux / Mac）

```bash
TOKEN="YOUR_TOKEN_HERE"
curl -X GET "http://localhost:3000/api/v1/patients/P001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 入院IDを指定する場合

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/P001?admissionId=A001" -Method Get -Headers $headers | ConvertTo-Json -Depth 10
```

**期待されるレスポンス:**
```json
{
  "patientId": "P001",
  "basicInfo": {
    "name": "山田 太郎",
    "nameKana": "ヤマダ タロウ",
    "birthDate": "1980-01-01",
    "gender": "男性",
    "contact": "03-1234-5678"
  },
  "admissionInfo": {
    "admissionId": "A001",
    "admissionDate": "2024-01-01",
    "dischargeDate": "2024-01-15",
    "department": "内科",
    "attendingPhysician": "佐藤 一郎",
    "ward": "3階東病棟"
  },
  "diagnoses": [...],
  "symptoms": "...",
  "examinations": {...},
  "treatments": "...",
  "prescriptions": [...],
  "guidance": "..."
}
```

## 4. サマリー生成API

### PowerShell

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    patientId = "P001"
    admissionId = "A001"
    options = @{
        templateVersion = "1.0"
        includeNursingRecords = $true
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summaries/generate" -Method Post -Headers $headers -Body $body | ConvertTo-Json -Depth 10
```

### curl

```bash
TOKEN="YOUR_TOKEN_HERE"
curl -X POST "http://localhost:3000/api/v1/summaries/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P001",
    "admissionId": "A001",
    "options": {
      "templateVersion": "1.0",
      "includeNursingRecords": true
    }
  }'
```

## 5. サマリー取得API

### PowerShell

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# まずサマリーIDを取得（サマリー生成APIのレスポンスから）
$summaryId = "S001"

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summaries/$summaryId" -Method Get -Headers $headers | ConvertTo-Json -Depth 10
```

## 6. サマリー更新API

### PowerShell

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$summaryId = "S001"
$body = @{
    content = "<html><h2>患者基本情報</h2><p>更新された内容</p></html>"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summaries/$summaryId" -Method Put -Headers $headers -Body $body | ConvertTo-Json -Depth 10
```

## 7. サマリー承認API

### PowerShell

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$summaryId = "S001"

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summaries/$summaryId/approve" -Method Post -Headers $headers | ConvertTo-Json -Depth 10
```

## 8. PDF生成API

### PowerShell

```powershell
$summaryId = "S001"
$body = @{
    outputFormat = "PDF"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summaries/$summaryId/pdf" -Method Post -Headers @{"Content-Type" = "application/json"} -Body $body | ConvertTo-Json -Depth 10
```

## エラーテスト

### 認証エラー（トークンなし）

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/P001" -Method Get
```

**期待されるレスポンス:**
```json
{
  "errorCode": "UNAUTHORIZED",
  "message": "認証トークンが必要です"
}
```

### 患者が見つからない（P999）

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/P999" -Method Get -Headers $headers
```

**期待されるレスポンス:**
```json
{
  "errorCode": "PATIENT_NOT_FOUND",
  "message": "患者が見つかりません"
}
```

## 一括テストスクリプト（PowerShell）

`test-api.ps1`を作成して、すべてのAPIを一括でテストできます：

```powershell
# test-api.ps1
$token = npm run token 2>&1 | Select-String -Pattern "Bearer" | ForEach-Object { $_.Line.Split(' ')[-1] }
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "=== ヘルスチェック ==="
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get

Write-Host "`n=== 患者データ取得 ==="
$patient = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/P001" -Method Get -Headers $headers
$patient | ConvertTo-Json -Depth 5

Write-Host "`n=== サマリー生成 ==="
$body = @{
    patientId = "P001"
    admissionId = "A001"
} | ConvertTo-Json
$summary = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summaries/generate" -Method Post -Headers $headers -Body $body
$summary | ConvertTo-Json -Depth 5
```

実行方法：
```powershell
.\test-api.ps1
```

## Postmanを使用する場合

1. Postmanを起動
2. 新しいリクエストを作成
3. リクエストタイプを選択（GET, POST, PUTなど）
4. URLを入力（例: `http://localhost:3000/api/v1/patients/P001`）
5. Headersタブで以下を追加：
   - `Authorization`: `Bearer YOUR_TOKEN_HERE`
   - `Content-Type`: `application/json`
6. Bodyタブ（POST/PUTの場合）でJSONを入力
7. Sendボタンをクリック

## ブラウザで確認する場合

### ヘルスチェック

ブラウザで直接アクセス：
```
http://localhost:3000/health
```

### 認証が必要なAPI

ブラウザでは直接アクセスできませんが、ブラウザ拡張機能（例: ModHeader）を使用してヘッダーを追加できます。

