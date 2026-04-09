param(
  [Parameter(Mandatory = $true)][string]$FirebaseProjectId
)

$backendRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $backendRoot

npm install
sam build
sam deploy `
  --region us-east-2 `
  --stack-name agrismart-community `
  --capabilities CAPABILITY_IAM `
  --resolve-s3 `
  --no-confirm-changeset `
  --no-fail-on-empty-changeset `
  --parameter-overrides `
    PostsTableName=agrismart-community-posts `
    CommentsTableName=agrismart-community-comments `
    ReactionsTableName=agrismart-community-reactions `
    MediaBucketName=agrismart-community-media `
    FirebaseProjectId=$FirebaseProjectId `
    AllowedOrigins="http://localhost:5173,http://127.0.0.1:5173,https://agrismartkenya.com,https://www.agrismartkenya.com"
