# API動作確認スクリプト
# 使用方法: .\test-api.ps1

# UTF-8エンコーディングを設定
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "=== API動作確認スクリプト ===" -ForegroundColor Green
Write-Host ""

# トークンを生成
Write-Host "1. トークンを生成中..." -ForegroundColor Yellow
$tokenOutput = npm run token 2>&1 | Out-String
$tokenMatch = $tokenOutput | Select-String -Pattern "Bearer\s+([^\s\n]+)"
if ($tokenMatch) {
    $token = $tokenMatch.Matches[0].Groups[1].Value
} else {
    # フォールバック: トークン行を直接取得
    $tokenLine = $tokenOutput | Select-String -Pattern "eyJ.*" | Select-Object -First 1
    if ($tokenLine) {
        $token = $tokenLine.Line.Trim()
    }
}

if (-not $token) {
    Write-Host "エラー: トークンの生成に失敗しました" -ForegroundColor Red
    exit 1
}

Write-Host "トークン生成完了" -ForegroundColor Green
Write-Host ""

# ヘッダーを設定
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# ヘルスチェック
Write-Host "2. ヘルスチェック..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
    Write-Host "[OK] ヘルスチェック成功" -ForegroundColor Green
    Write-Host "Response: $($health | ConvertTo-Json -Compress)"
} catch {
    Write-Host "[NG] ヘルスチェック失敗: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 患者データ取得
Write-Host "3. 患者データ取得 (P001)..." -ForegroundColor Yellow
try {
    $patient = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/P001" -Method Get -Headers $headers
    Write-Host "[OK] 患者データ取得成功" -ForegroundColor Green
    Write-Host "  - 患者名: $($patient.basicInfo.name)"
    Write-Host "  - 診療科: $($patient.admissionInfo.department)"
    Write-Host "  - 入院ID: $($patient.admissionInfo.admissionId)"
} catch {
    Write-Host "[NG] 患者データ取得失敗" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  エラーレスポンス: $responseBody"
        } catch {
            Write-Host "  エラー: $_"
        }
    } else {
        Write-Host "  エラー: $_"
    }
}
Write-Host ""

# サマリー生成
Write-Host "4. サマリー生成..." -ForegroundColor Yellow
$summaryId = $null
try {
    $body = @{
        patientId = "P001"
        admissionId = "A001"
        options = @{
            templateVersion = "1.0"
            includeNursingRecords = $true
        }
    } | ConvertTo-Json

    $summary = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summaries/generate" -Method Post -Headers $headers -Body $body
    Write-Host "[OK] サマリー生成成功" -ForegroundColor Green
    Write-Host "  - サマリーID: $($summary.summaryId)"
    Write-Host "  - ステータス: $($summary.status)"
    Write-Host "  - バージョン: $($summary.version)"
    Write-Host ""
    Write-Host "=== 生成されたサマリー内容（プレビュー） ===" -ForegroundColor Cyan
    if ($summary.content) {
        # HTMLタグを除去してテキストのみ表示
        $textContent = $summary.content -replace '<[^>]+>', ''
        $textContent = $textContent -replace '\s+', ' '
        $textContent = $textContent.Trim()
        
        # 長い場合は最初の300文字を表示
        if ($textContent.Length -gt 300) {
            Write-Host $textContent.Substring(0, 300) "..."
            Write-Host ""
            Write-Host "(内容が長いため、最初の300文字のみ表示しています。完全な内容は次の「サマリー取得」で確認できます)"
        } else {
            Write-Host $textContent
        }
    } else {
        Write-Host "  コンテンツが空です"
    }
    Write-Host ""
    
    # 生成されたサマリーIDを保存
    $summaryId = $summary.summaryId
} catch {
    Write-Host "[NG] サマリー生成失敗" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  エラーレスポンス: $responseBody"
        } catch {
            Write-Host "  エラー: $_"
        }
    } else {
        Write-Host "  エラー: $_"
    }
    $summaryId = "S001" # フォールバック
}
Write-Host ""

# サマリー取得
if ($summaryId) {
    Write-Host "5. サマリー取得 ($summaryId)..." -ForegroundColor Yellow
    try {
        $summary = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summaries/$summaryId" -Method Get -Headers $headers
        Write-Host "[OK] サマリー取得成功" -ForegroundColor Green
        Write-Host "  - バージョン: $($summary.version)"
        Write-Host "  - ステータス: $($summary.status)"
        Write-Host "  - 作成日: $($summary.createdAt)"
        Write-Host ""
        Write-Host "=== サマリー内容 ===" -ForegroundColor Cyan
        if ($summary.content) {
            # HTMLタグを除去してテキストのみ表示
            $textContent = $summary.content -replace '<[^>]+>', ''
            $textContent = $textContent -replace '\s+', ' '
            $textContent = $textContent.Trim()
            
            # 長い場合は最初の500文字を表示
            if ($textContent.Length -gt 500) {
                Write-Host $textContent.Substring(0, 500) "..."
                Write-Host ""
                Write-Host "(内容が長いため、最初の500文字のみ表示しています)"
            } else {
                Write-Host $textContent
            }
            Write-Host ""
            Write-Host "=== 完全なHTMLコンテンツ ===" -ForegroundColor Cyan
            Write-Host $summary.content
        } else {
            Write-Host "  コンテンツが空です"
        }
    } catch {
        Write-Host "[NG] サマリー取得失敗" -ForegroundColor Red
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "  エラーレスポンス: $responseBody"
            } catch {
                Write-Host "  エラー: $_"
            }
        } else {
            Write-Host "  エラー: $_"
        }
    }
    Write-Host ""
}

# エラーテスト: 患者が見つからない
Write-Host "6. エラーテスト: 存在しない患者 (P999)..." -ForegroundColor Yellow
try {
    $errorResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/P999" -Method Get -Headers $headers
    Write-Host "[NG] エラーが発生すべきでしたが、成功しました" -ForegroundColor Red
} catch {
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd() | ConvertFrom-Json
        Write-Host "[OK] 期待通りのエラーが発生しました" -ForegroundColor Green
        Write-Host "  - エラーコード: $($responseBody.errorCode)"
        Write-Host "  - メッセージ: $($responseBody.message)"
    } catch {
        Write-Host "[OK] エラーが発生しました（詳細の取得に失敗）" -ForegroundColor Green
        Write-Host "  - エラー: $_"
    }
}
Write-Host ""

Write-Host "=== テスト完了 ===" -ForegroundColor Green
