# トラブルシューティングガイド

## よくあるエラーと解決方法

### 1. サーバーに接続できない

**エラーメッセージ:**
```
[NG] サーバーに接続できません
```

**解決方法:**
1. サーバーが起動しているか確認
   ```powershell
   # 別のターミナルで
   npm run dev
   ```

2. ポート3000が使用中でないか確認
   ```powershell
   netstat -ano | findstr :3000
   ```

3. `.env`ファイルでポートを変更
   ```env
   PORT=3001
   ```

### 2. 認証エラー

**エラーメッセージ:**
```
[NG] 患者データ取得失敗
HTTPステータス: 401
```

**解決方法:**
1. トークンが正しく生成されているか確認
   ```powershell
   npm run token
   ```

2. `.env`ファイルの`JWT_SECRET`が正しいか確認
   ```env
   JWT_SECRET=default-secret-key
   ```

### 3. 患者が見つからないエラー

**エラーメッセージ:**
```
[NG] 患者データ取得失敗
HTTPステータス: 404
エラーコード: PATIENT_NOT_FOUND
```

**解決方法:**
- モックモードでは、以下の患者IDが使用可能です：
  - `P001`: 正常なデータを返す
  - `P999`: 患者が見つからないエラー（テスト用）
  - `EMR_ERROR`: 電子カルテシステムエラー（テスト用）

### 4. サマリー生成エラー

**エラーメッセージ:**
```
[NG] サマリー生成失敗
```

**解決方法:**
1. 患者データが正常に取得できるか確認
   ```powershell
   # 患者データ取得を先にテスト
   ```

2. LLMエンジンの設定を確認
   - モックモードでは`LLM_API_KEY=mock-api-key`で動作します

### 5. 文字化け

**症状:**
- 日本語が正しく表示されない

**解決方法:**
1. PowerShellのエンコーディングを設定
   ```powershell
   [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
   chcp 65001
   ```

2. スクリプト実行時にエンコーディングを指定
   ```powershell
   powershell -ExecutionPolicy Bypass -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; .\test-api.ps1"
   ```

### 6. タイムアウトエラー

**エラーメッセージ:**
```
タイムアウトしました
```

**解決方法:**
1. サーバーが正常に動作しているか確認
2. ネットワーク接続を確認
3. タイムアウト時間を延長（スクリプト内の`-TimeoutSec`パラメータを調整）

## ログの確認方法

### サーバーログ

サーバーを起動したターミナルで、以下のようなログが表示されます：

```
Server is running on port 3000
```

エラーが発生した場合、詳細なエラーメッセージが表示されます。

### APIレスポンスの確認

テストスクリプトを実行すると、各APIのレスポンスが表示されます。
エラーが発生した場合、HTTPステータスコードとエラーメッセージが表示されます。

## デバッグ方法

### 1. 個別のAPIをテスト

```powershell
# トークン生成
$token = (npm run token 2>&1 | Select-String -Pattern "eyJ.*").Line.Trim()

# ヘッダー設定
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 個別にテスト
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/P001" -Method Get -Headers $headers
```

### 2. サーバーの再起動

```powershell
# サーバーを停止
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force

# サーバーを再起動
npm run dev
```

### 3. 環境変数の確認

```powershell
# .envファイルの内容を確認
Get-Content .env
```

## サポート

問題が解決しない場合は、以下を確認してください：

1. Node.jsのバージョン（推奨: 20.x）
2. 依存関係のインストール（`npm install`）
3. ビルドの実行（`npm run build`）
4. テストの実行（`npm test`）

