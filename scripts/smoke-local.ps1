# Smoke test for local dev stack (run while pnpm dev:local is up)
$ErrorActionPreference = "Stop"
$checks = @(
  @{ Name = "DB gateway health"; Url = "http://127.0.0.1:4000/health" },
  @{ Name = "Polls stats"; Url = "http://127.0.0.1:4000/polls/stats" },
  @{ Name = "Proof demo collection"; Url = "http://127.0.0.1:4000/proof/collections/demo" },
  @{ Name = "Metrics dashboard data"; Url = "http://127.0.0.1:4000/metrics/dashboard" },
  @{ Name = "Standard Polls home"; Url = "http://127.0.0.1:3001" },
  @{ Name = "Standard Proof home"; Url = "http://127.0.0.1:3002" },
  @{ Name = "Standard Proof /c/demo"; Url = "http://127.0.0.1:3002/c/demo" },
  @{ Name = "Standard Proof embed iframe"; Url = "http://127.0.0.1:3002/embed/demo" },
  @{ Name = "Standard Proof embed script"; Url = "http://127.0.0.1:3002/api/embed/demo.js" },
  @{ Name = "Standard Metrics dashboard"; Url = "http://127.0.0.1:3003/dashboard" }
)

$failed = 0
foreach ($c in $checks) {
  try {
    $r = Invoke-WebRequest -Uri $c.Url -TimeoutSec 15 -UseBasicParsing
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
      Write-Host "OK  $($c.Name)"
    } else {
      Write-Host "FAIL $($c.Name) ($($r.StatusCode))"
      $failed++
    }
  } catch {
    Write-Host "FAIL $($c.Name) - $($_.Exception.Message)"
    $failed++
  }
}

if ($failed -gt 0) {
  Write-Host "`n$failed check(s) failed."
  exit 1
}

Write-Host "`nAll local smoke checks passed."
