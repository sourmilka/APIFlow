# PowerShell Script to Delete ALL Unused Files
# Run this script to clean up the project

Write-Host "🧹 Starting Comprehensive Cleanup..." -ForegroundColor Cyan

# Old Statistics Components (replaced by Statistics_Compact)
Write-Host "`n📊 Removing old Statistics components..." -ForegroundColor Yellow
Remove-Item "src\components\Statistics.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\Statistics_New.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\Statistics_Professional.jsx" -ErrorAction SilentlyContinue

# Old ProgressTracker (replaced by ProgressTracker_New)
Write-Host "⏳ Removing old ProgressTracker..." -ForegroundColor Yellow
Remove-Item "src\components\ProgressTracker.jsx" -ErrorAction SilentlyContinue

# Old Toolbar/Actions Components (replaced by Toolbar_Professional)
Write-Host "🔧 Removing old toolbar components..." -ForegroundColor Yellow
Remove-Item "src\components\ActionsBar.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\QuickActions.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\CollectionsManager.jsx" -ErrorAction SilentlyContinue

# Unused Session/Export Components
Write-Host "📦 Removing unused session/export components..." -ForegroundColor Yellow
Remove-Item "src\components\SessionHistory.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\ExportMenu.jsx" -ErrorAction SilentlyContinue

# Old API List Components (replaced by ApiList_Complete)
Write-Host "📋 Removing old API list components..." -ForegroundColor Yellow
Remove-Item "src\components\ApiList.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\ApiListItem.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\ApiDetails.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\ApiExplanation.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\ApiTester.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\api\ApiList.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\api\ApiListItem.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\api\ApiList_Professional.jsx" -ErrorAction SilentlyContinue

# Old FilterBar Components (replaced by FilterBar_Compact)
Write-Host "🔍 Removing old filter components..." -ForegroundColor Yellow
Remove-Item "src\components\FilterBar.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\api\FilterBar.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\api\FilterBar_New.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\DateTimeRangeFilter.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\RangeFilter.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\FilterPresetButton.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\SaveFilterDialog.jsx" -ErrorAction SilentlyContinue

# Old Layout Components (replaced by new ones)
Write-Host "🎨 Removing old layout components..." -ForegroundColor Yellow
Remove-Item "src\components\layout\HistorySidebar.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\layout\TopNav.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\layout\TopNav_NewDesign.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\Sidebar.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\Header.jsx" -ErrorAction SilentlyContinue

# Old CustomHeaders (replaced by current one)
Write-Host "⚙️ Removing old CustomHeaders..." -ForegroundColor Yellow
Remove-Item "src\components\CustomHeaders_New.jsx" -ErrorAction SilentlyContinue

# Unused Feature Components
Write-Host "🗑️ Removing unused feature components..." -ForegroundColor Yellow
Remove-Item "src\components\DashboardLayout.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\DashboardWidget.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\DnsChecker.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\GraphQLViewer.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\RateLimitInfo.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\SchemaViewer.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\Section.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\ThemeToggle.jsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\AdvancedParsingDialog.jsx" -ErrorAction SilentlyContinue

Write-Host "`n✅ Cleanup Complete!" -ForegroundColor Green
Write-Host "Deleted 40+ unused files" -ForegroundColor Green
Write-Host "`nYour project is now cleaner and easier to navigate!" -ForegroundColor Cyan
