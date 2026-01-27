# Script chuyển đổi HTML sang Word (.docx)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$htmlPath = Join-Path $projectRoot "KIEN-TRUC-HE-THONG.html"
$docxPath = Join-Path $projectRoot "KIEN-TRUC-HE-THONG.docx"

Write-Host "Đang chuyển đổi HTML sang Word..." -ForegroundColor Green

try {
    # Tạo COM object của Word
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    
    # Mở file HTML
    Write-Host "Đang mở file HTML..." -ForegroundColor Yellow
    $doc = $word.Documents.Open($htmlPath)
    
    # Lưu dưới dạng Word
    Write-Host "Đang lưu file Word..." -ForegroundColor Yellow
    $doc.SaveAs([ref]$docxPath, [ref]16) # 16 = wdFormatDocumentDefault (.docx)
    
    # Đóng document và Word
    $doc.Close()
    $word.Quit()
    
    # Release COM objects
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    
    Write-Host "✅ Đã xuất thành công file Word tại: $docxPath" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi: $_" -ForegroundColor Red
    Write-Host "Vui lòng mở file HTML bằng Word và lưu lại dưới dạng .docx" -ForegroundColor Yellow
    exit 1
}
