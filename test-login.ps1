$body = @{
    email = "owner@example.com"
    password = "password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"

Write-Host "Login Response:"
$response | ConvertTo-Json -Depth 10