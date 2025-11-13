# テストスクリプト実行用ラッパー
# 使用方法: .\run-test.ps1

# UTF-8エンコーディングを設定
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# スクリプトを実行
& ".\test-api.ps1"

