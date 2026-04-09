param(
  [string]$BucketName = "agrismart-community-media",
  [string[]]$AllowedOrigins = @(
    "https://agrismartkenya.com",
    "https://www.agrismartkenya.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
  )
)

$corsConfig = @{
  CORSRules = @(
    @{
      AllowedOrigins = $AllowedOrigins
      AllowedHeaders = @("*")
      AllowedMethods = @("PUT", "GET", "HEAD")
      MaxAgeSeconds = 3000
    }
  )
}

$tempPath = Join-Path $env:TEMP "agrismart-community-media-cors.json"
$corsConfig | ConvertTo-Json -Depth 5 | Set-Content -Path $tempPath -Encoding UTF8

aws s3api put-bucket-cors --bucket $BucketName --cors-configuration "file://$tempPath"
