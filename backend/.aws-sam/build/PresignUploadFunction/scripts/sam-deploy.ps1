param(
  [Parameter(Mandatory = $true)][string]$FirebaseProjectId
)

$backendRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $backendRoot

npm install
sam build
sam deploy --guided --region us-east-2 \
  --stack-name agrismart-community \
  --parameter-overrides \
    PostsTableName=agrismart-community-posts \
    CommentsTableName=agrismart-community-comments \
    ReactionsTableName=agrismart-community-reactions \
    MediaBucketName=agrismart-community-media \
    FirebaseProjectId=$FirebaseProjectId \
    AllowedOrigins="http://localhost:5173,https://crop-conduit-ui.web.app"
