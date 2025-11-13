# API動作確認スクリプト（詳細版）
# 使用方法: .\test-api-verbose.ps1

# UTF-8エンコーディングを設定
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# エラー処理を詳細に
$ErrorActionPreference = "Continue"

Write-Host "=== API動作確認スクリプト（詳細版） ===" -ForegroundColor Green
Write-Host ""

# サーバー接続確認
Write-Host "0. サーバー接続確認..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5
    Write-Host "[OK] サーバーに接続できました" -ForegroundColor Green
} catch {
    Write-Host "[NG] サーバーに接続できません" -ForegroundColor Red
    Write-Host "  エラー: $_" -ForegroundColor Red
    Write-Host "  サーバーが起動しているか確認してください: npm run dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# トークンを生成
Write-Host "1. トークンを生成中..." -ForegroundColor Yellow
try {
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
        Write-Host "[NG] トークンの生成に失敗しました" -ForegroundColor Red
        Write-Host "  出力: $tokenOutput" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "[OK] トークン生成完了" -ForegroundColor Green
} catch {
    Write-Host "[NG] トークン生成中にエラーが発生しました" -ForegroundColor Red
    Write-Host "  エラー: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ヘッダーを設定
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# ヘルスチェック
Write-Host "2. ヘルスチェック..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5
    Write-Host "[OK] ヘルスチェック成功" -ForegroundColor Green
    Write-Host "  Response: $($health | ConvertTo-Json -Compress)"
} catch {
    Write-Host "[NG] ヘルスチェック失敗" -ForegroundColor Red
    Write-Host "  エラー: $_" -ForegroundColor Red
    Write-Host "  詳細: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 患者データ取得
Write-Host "3. 患者データ取得 (P001)..." -ForegroundColor Yellow
try {
    $patient = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/P001" -Method Get -Headers $headers -TimeoutSec 10
    Write-Host "[OK] 患者データ取得成功" -ForegroundColor Green
    Write-Host "  - 患者名: $($patient.basicInfo.name)"
    Write-Host "  - 診療科: $($patient.admissionInfo.department)"
    Write-Host "  - 入院ID: $($patient.admissionInfo.admissionId)"
} catch {
    Write-Host "[NG] 患者データ取得失敗" -ForegroundColor Red
    Write-Host "  エラー: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $statusCode = $_.Exception.Response.StatusCode.value__
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            $stream.Close()
            Write-Host "  HTTPステータス: $statusCode" -ForegroundColor Yellow
            Write-Host "  レスポンス: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "  詳細取得失敗: $_" -ForegroundColor Yellow
        }
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

    $summary = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summaries/generate" -Method Post -Headers $headers -Body $body -TimeoutSec 30
    Write-Host "[OK] サマリー生成成功" -ForegroundColor Green
    Write-Host "  - サマリーID: $($summary.summaryId)"
    Write-Host "  - ステータス: $($summary.status)"
    Write-Host "  - バージョン: $($summary.version)"
    
    if ($summary.content) {
        $textContent = $summary.content -replace '<[^>]+>', '' -replace '\s+', ' ' -replace '^\s+|\s+$', ''
        if ($textContent.Length -gt 200) {
            Write-Host "  - 内容プレビュー: $($textContent.Substring(0, 200))..."
        } else {
            Write-Host "  - 内容: $textContent"
        }
    }
    
    $summaryId = $summary.summaryId
} catch {
    Write-Host "[NG] サマリー生成失敗" -ForegroundColor Red
    Write-Host "  エラー: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $statusCode = $_.Exception.Response.StatusCode.value__
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            $stream.Close()
            Write-Host "  HTTPステータス: $statusCode" -ForegroundColor Yellow
            Write-Host "  レスポンス: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "  詳細取得失敗: $_" -ForegroundColor Yellow
        }
    }
    $summaryId = "S001"
}
Write-Host ""

# サマリー取得
if ($summaryId) {
    Write-Host "5. サマリー取得 ($summaryId)..." -ForegroundColor Yellow
    try {
        $summary = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summaries/$summaryId" -Method Get -Headers $headers -TimeoutSec 10
        Write-Host "[OK] サマリー取得成功" -ForegroundColor Green
        Write-Host "  - バージョン: $($summary.version)"
        Write-Host "  - ステータス: $($summary.status)"
        Write-Host "  - 作成日: $($summary.createdAt)"
        if ($summary.content) {
            Write-Host ""
            Write-Host "  === サマリー内容（テキスト） ===" -ForegroundColor Cyan
            $textContent = $summary.content -replace '<[^>]+>', ''
            $textContent = $textContent -replace '\s+', ' '
            $textContent = $textContent.Trim()
            if ($textContent.Length -gt 500) {
                Write-Host "  $($textContent.Substring(0, 500))..."
            } else {
                Write-Host "  $textContent"
            }
        }
    } catch {
        Write-Host "[NG] サマリー取得失敗" -ForegroundColor Red
        Write-Host "  エラー: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            try {
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $responseBody = $reader.ReadToEnd()
                $reader.Close()
                $stream.Close()
                Write-Host "  HTTPステータス: $statusCode" -ForegroundColor Yellow
                Write-Host "  レスポンス: $responseBody" -ForegroundColor Yellow
            } catch {
                Write-Host "  詳細取得失敗: $_" -ForegroundColor Yellow
            }
        }
    }
    Write-Host ""
}

Write-Host "=== テスト完了 ===" -ForegroundColor Green

