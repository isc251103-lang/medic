# 退院時サマリー自動作成システム

## プロジェクト概要

電子カルテ情報に基づき、退院時サマリーのドラフトを自動生成するシステムです。

## 技術スタック

- Node.js 20.x
- TypeScript 5.3
- Express 4.x
- Jest (テストフレームワーク)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、必要に応じて値を変更してください：

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

`.env`ファイルの内容：

```env
PORT=3000
JWT_SECRET=your-secret-key-change-this-in-production
EMR_BASE_URL=http://localhost:3001
EMR_MOCK_MODE=true
LLM_API_KEY=mock-api-key
LLM_BASE_URL=https://api.openai.com/v1
```

**環境変数の説明**:
- `PORT`: サーバーのポート番号（デフォルト: 3000）
- `JWT_SECRET`: JWTトークンの署名に使用する秘密鍵
- `EMR_BASE_URL`: 電子カルテシステムのベースURL
- `EMR_MOCK_MODE`: `true`に設定すると、モックデータを返します（開発・テスト環境推奨）
- `LLM_API_KEY`: LLM APIのキー（モックモードの場合は任意）
- `LLM_BASE_URL`: LLM APIのベースURL

### 3. ビルド（本番環境用）

```bash
npm run build
```

### 4. アプリケーションの起動

#### 開発モード（推奨）

ホットリロード対応で開発サーバーを起動します：

```bash
npm run dev
```

サーバーが起動すると、以下のメッセージが表示されます：
```
Server is running on port 3000
```

#### 本番モード

ビルド後に本番モードで起動します：

```bash
npm run build
npm start
```

### 5. 動作確認

サーバー起動後、以下のエンドポイントで動作確認できます：

#### ヘルスチェック

```bash
curl http://localhost:3000/health
```

レスポンス例：
```json
{
  "status": "ok"
}
```

#### テスト用トークンの生成

APIをテストするために、JWTトークンを生成します：

```bash
npm run token
```

このコマンドで生成されたトークンを、APIリクエストの`Authorization`ヘッダーに使用します。

#### APIテストの例

1. **ヘルスチェック**
   ```bash
   curl http://localhost:3000/health
   ```

2. **患者データ取得**（モックデータが返却されます）
   ```bash
   # まずトークンを生成
   TOKEN=$(npm run token 2>&1 | Select-String -Pattern "Bearer" | ForEach-Object { $_.Line.Split(' ')[-1] })
   
   # 患者データを取得
   curl -X GET "http://localhost:3000/api/v1/patients/P001" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

**注意**: 現在の実装では、電子カルテシステム（EMR_BASE_URL）が実際に動作していない場合、患者データ取得APIはエラーを返します。テスト環境では、EMRClientのモック実装を使用することを推奨します。

### テスト実行

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ確認
npm run test:coverage
```

## 環境変数

`.env`ファイルを作成して以下の環境変数を設定してください：

```
PORT=3000
JWT_SECRET=your-secret-key
EMR_BASE_URL=http://localhost:3001
```

## APIエンドポイント

### 認証トークンの取得

テスト用のJWTトークンを生成するには、以下のようなスクリプトを使用できます：

```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 'user001' }, 'your-secret-key-change-this-in-production');
console.log(token);
```

### GET /api/v1/patients/:patientId

患者データを取得します。

**リクエスト例:**
```bash
curl -X GET "http://localhost:3000/api/v1/patients/P001" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**リクエストヘッダー:**
- `Authorization: Bearer {token}` (必須)

**クエリパラメータ:**
- `admissionId` (任意): 入院ID

**レスポンス:**
- 200 OK: 患者データ
- 400 Bad Request: 無効な患者ID
- 401 Unauthorized: 認証エラー
- 403 Forbidden: 認可エラー
- 404 Not Found: 患者が見つからない
- 500 Internal Server Error: サーバーエラー
- 503 Service Unavailable: 電子カルテシステムエラー

### POST /api/v1/summaries/generate

サマリーを自動生成します。

**リクエスト例:**
```bash
curl -X POST "http://localhost:3000/api/v1/summaries/generate" \
  -H "Authorization: Bearer {token}" \
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

### GET /api/v1/summaries/:summaryId

サマリーを取得します。

**リクエスト例:**
```bash
curl -X GET "http://localhost:3000/api/v1/summaries/S001" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### PUT /api/v1/summaries/:summaryId

サマリーを更新します。

**リクエスト例:**
```bash
curl -X PUT "http://localhost:3000/api/v1/summaries/S001" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<html>Updated summary content</html>"
  }'
```

### POST /api/v1/summaries/:summaryId/approve

サマリーを承認します。

**リクエスト例:**
```bash
curl -X POST "http://localhost:3000/api/v1/summaries/S001/approve" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### POST /api/v1/summaries/:summaryId/pdf

PDFを生成します。

**リクエスト例:**
```bash
curl -X POST "http://localhost:3000/api/v1/summaries/S001/pdf" \
  -H "Content-Type: application/json" \
  -d '{
    "outputFormat": "PDF"
  }'
```

## ディレクトリ構造

```
src/
├── __tests__/          # テストファイル
├── modules/            # モジュール（認証、EMR連携、データ変換など）
├── routes/             # APIルート
├── services/           # ビジネスロジック
├── types/              # 型定義
└── index.ts            # エントリーポイント
```

## TDD開発

このプロジェクトはTDD（Test-Driven Development）で開発されています。

1. テストを先に書く（Red）
2. テストが失敗することを確認
3. 最小限の実装を書く（Green）
4. リファクタリング（Refactor）

## ライセンス

ISC

