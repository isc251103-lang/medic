# クイックスタートガイド

## アプリケーションの実行方法

### 1. 依存関係のインストール（初回のみ）

```bash
npm install
```

### 2. 環境変数の設定（初回のみ）

`.env`ファイルが存在しない場合は、以下の内容で作成してください：

```env
PORT=3000
JWT_SECRET=default-secret-key
EMR_BASE_URL=http://localhost:3001
LLM_API_KEY=mock-api-key
LLM_BASE_URL=https://api.openai.com/v1
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

サーバーが起動すると、以下のメッセージが表示されます：
```
Server is running on port 3000
```

### 4. 動作確認

#### ヘルスチェック

別のターミナルを開いて、以下を実行：

```bash
curl http://localhost:3000/health
```

期待されるレスポンス：
```json
{
  "status": "ok"
}
```

#### テスト用トークンの生成

```bash
npm run token
```

このコマンドで生成されたトークンをコピーして、APIリクエストで使用します。

#### APIテスト例

**患者データ取得**（注意: 電子カルテシステムが動作していない場合はエラーになります）

```bash
# トークンを生成（上記のコマンドで取得）
TOKEN="your-token-here"

# 患者データを取得
curl -X GET "http://localhost:3000/api/v1/patients/P001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## 本番環境での実行

### 1. ビルド

```bash
npm run build
```

### 2. 起動

```bash
npm start
```

## トラブルシューティング

### ポートが既に使用されている場合

`.env`ファイルで`PORT`を変更してください：

```env
PORT=3001
```

### 電子カルテシステムが動作していない場合

現在の実装では、実際の電子カルテシステムに接続しようとします。テスト環境では、EMRClientのモック実装を使用するか、電子カルテシステムのモックサーバーを起動してください。

### モジュールが見つからないエラー

```bash
npm install
```

を実行して、依存関係を再インストールしてください。

