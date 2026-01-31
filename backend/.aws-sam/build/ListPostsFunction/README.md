# AgriSmart Community Connect Backend (AWS SAM)

Production-ready, minimal-cost serverless backend for a community feed using AWS Lambda (Node.js 20), HTTP API, DynamoDB (PAY_PER_REQUEST), and private S3.

## Architecture Overview
- AWS Lambda handlers in `src/handlers`
- Shared libs in `src/lib` and `src/middleware`
- AWS SAM template in `template.yaml`
- DynamoDB tables: posts, comments, reactions
- S3: private media bucket with CORS for browser uploads
- Firebase Authentication: JWT verification via JWKS (no admin SDK)

---

## 1) DynamoDB Design + Schema

### Posts Table: `agrismart-community-posts`
- **PK:** `postId` (string)
- **Attributes:** `authorId`, `authorName`, `authorEmail`, `text`, `imageKey`, `createdAt`, `updatedAt`, `commentCount`, `reactionCount`
- **GSI1-Feed** (for latest feed):
  - **PK:** `gsi1pk` (value: `FEED`)
  - **SK:** `gsi1sk` (value: `${createdAt}#${postId}`)
- **GSI2-UserPosts** (lookup by author):
  - **PK:** `gsi2pk` (value: `USER#${authorId}`)
  - **SK:** `gsi2sk` (value: `${createdAt}#${postId}`)

**Example post item**
```json
{
  "postId": "b0c1a1d2-1234-4c01-9a4f-3f0f97b2e8b9",
  "authorId": "firebase-uid-123",
  "authorName": "Pat Farmer",
  "authorEmail": "pat@example.com",
  "text": "Harvest looks great this week!",
  "imageKey": "community/firebase-uid-123/8d7c4b02-7cdb-4a1d-9b0c-a1b2c3d4e5f6.jpg",
  "createdAt": "2026-01-31T18:30:00.000Z",
  "updatedAt": "2026-01-31T18:30:00.000Z",
  "commentCount": 2,
  "reactionCount": 5,
  "gsi1pk": "FEED",
  "gsi1sk": "2026-01-31T18:30:00.000Z#b0c1a1d2-1234-4c01-9a4f-3f0f97b2e8b9",
  "gsi2pk": "USER#firebase-uid-123",
  "gsi2sk": "2026-01-31T18:30:00.000Z#b0c1a1d2-1234-4c01-9a4f-3f0f97b2e8b9"
}
```

### Comments Table: `agrismart-community-comments`
- **PK:** `postId` (string)
- **SK:** `commentKey` (value: `${createdAt}#${commentId}`)
- **GSI1-UserComments** (optional user lookup):
  - **PK:** `gsi1pk` (value: `USER#${authorId}`)
  - **SK:** `gsi1sk` (value: `${createdAt}#${commentId}`)

**Example comment item**
```json
{
  "postId": "b0c1a1d2-1234-4c01-9a4f-3f0f97b2e8b9",
  "commentKey": "2026-01-31T18:35:00.000Z#c9d7c1bb-7d3f-4d5b-9ee8-3f9cb0c3a4a1",
  "commentId": "c9d7c1bb-7d3f-4d5b-9ee8-3f9cb0c3a4a1",
  "authorId": "firebase-uid-789",
  "authorName": "Jordan",
  "authorEmail": "jordan@example.com",
  "text": "Nice work!",
  "createdAt": "2026-01-31T18:35:00.000Z",
  "gsi1pk": "USER#firebase-uid-789",
  "gsi1sk": "2026-01-31T18:35:00.000Z#c9d7c1bb-7d3f-4d5b-9ee8-3f9cb0c3a4a1"
}
```

### Reactions Table: `agrismart-community-reactions`
- **PK:** `postId` (string)
- **SK:** `userId` (string)
- **Attributes:** `reactionType` ("like"), `createdAt`

**Example reaction item**
```json
{
  "postId": "b0c1a1d2-1234-4c01-9a4f-3f0f97b2e8b9",
  "userId": "firebase-uid-123",
  "reactionType": "like",
  "createdAt": "2026-01-31T18:40:00.000Z"
}
```

**Counts strategy**
- `commentCount` and `reactionCount` are stored in the post item and updated atomically when comments/reactions are added/removed to avoid expensive scans.

---

## 2) S3 Setup
- **Bucket:** `agrismart-community-media`
- Private bucket with Block Public Access enabled
- CORS: allow browser PUT/GET from:
  - `http://localhost:5173`
  - `https://crop-conduit-ui.web.app`

**Key pattern**
```
community/{postId or userId}/{uuid}.{ext}
```

---

## 3) API Endpoints
All endpoints require Firebase ID token:
`Authorization: Bearer <token>`

- `POST /community/posts` -- create a post
- `GET /community/posts` -- list feed (pagination)
- `GET /community/posts/{postId}` -- post + comments + counts
- `POST /community/posts/{postId}/comments` -- create comment
- `GET /community/posts/{postId}/comments` -- list comments (pagination)
- `POST /community/posts/{postId}/reactions` -- toggle like
- `POST /community/uploads/presign` -- get pre-signed S3 PUT URL

---

## 4) Firebase Token Verification
- Uses Firebase JWT verification with public keys (JWKS) from Google.
- Validates `aud` (project id) and `iss`.
- Rejects invalid/expired tokens.
- Tokens are never logged.

Set environment variable:
```
FIREBASE_PROJECT_ID=<your-firebase-project-id>
```

---

## 5) Repo Structure
```
backend/
  src/
    handlers/
      createPost.js
      listPosts.js
      getPost.js
      createComment.js
      listComments.js
      toggleReaction.js
      presignUpload.js
    lib/
      dynamo.js
      response.js
      pagination.js
      validation.js
      firebase.js
      errors.js
    middleware/
      auth.js
  package.json
  template.yaml
  README.md
```

---

## 6) Deployment (AWS SAM)

### Prereqs
- AWS CLI configured
- AWS SAM CLI installed
- Region: `us-east-2`

### Deploy
```bash
cd backend
npm install
sam build
sam deploy --guided --region us-east-2 \
  --stack-name agrismart-community \
  --parameter-overrides \
    PostsTableName=agrismart-community-posts \
    CommentsTableName=agrismart-community-comments \
    ReactionsTableName=agrismart-community-reactions \
    MediaBucketName=agrismart-community-media \
    FirebaseProjectId=YOUR_FIREBASE_PROJECT_ID \
    AllowedOrigins="http://localhost:5173,https://crop-conduit-ui.web.app"
```

Optional PowerShell helper:
```powershell
.\scripts\sam-deploy.ps1 -FirebaseProjectId YOUR_FIREBASE_PROJECT_ID
```

### Get API Base URL
```bash
aws cloudformation describe-stacks \
  --region us-east-2 \
  --stack-name agrismart-community \
  --query "Stacks[0].Outputs[--OutputKey=='ApiBaseUrl'].OutputValue" \
  --output text
```

### Local test (curl)
```bash
API_BASE_URL=<output from CloudFormation>
FIREBASE_ID_TOKEN=<firebase-id-token>

curl -sS "$API_BASE_URL/community/posts" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN"

curl -sS "$API_BASE_URL/community/posts?limit=12" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN"

curl -sS -X POST "$API_BASE_URL/community/uploads/presign" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{\"filename\":\"test.jpg\",\"contentType\":\"image/jpeg\"}'

curl -sS "$API_BASE_URL/community/posts" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from the farm!"}'

curl -sS "$API_BASE_URL/community/uploads/presign" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contentType":"image/jpeg","fileExt":"jpg"}'
```

### Env variables & secrets (safe practice)
- Use SAM parameters for non-sensitive values.
- For secrets or config you don't want in templates, use AWS Systems Manager Parameter Store or Secrets Manager and load them at runtime.

---

## 7) Cost Protection & Throttling

### AWS Budget (monthly)
```bash
aws budgets create-budget --region us-east-2 --account-id $(aws sts get-caller-identity --query Account --output text) --budget '{
  "BudgetName":"agrismart-community-budget",
  "BudgetLimit":{"Amount":"25","Unit":"USD"},
  "TimeUnit":"MONTHLY",
  "BudgetType":"COST",
  "CostFilters":{},
  "CostTypes":{"IncludeTax":true,"IncludeSubscription":true,"UseBlended":false,"IncludeRefund":false,"IncludeCredit":false,"IncludeUpfront":true,"IncludeRecurring":true,"IncludeOtherSubscription":true,"IncludeSupport":true,"IncludeDiscount":true,"UseAmortized":false}
}'
```

### Budget Notification
```bash
aws budgets create-notification --region us-east-2 --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget-name agrismart-community-budget \
  --notification '{
    "NotificationType":"ACTUAL",
    "ComparisonOperator":"GREATER_THAN",
    "Threshold":80,
    "ThresholdType":"PERCENTAGE"
  }' \
  --subscribers '[{"SubscriptionType":"EMAIL","Address":"you@example.com"}]'
```

### API Throttling (HTTP API)
Set rate limiting on your default stage:
```bash
aws apigatewayv2 update-stage \
  --region us-east-2 \
  --api-id <api-id> \
  --stage-name \$default \
  --default-route-settings ThrottlingRateLimit=20,ThrottlingBurstLimit=40
```

---

## 8) Pure AWS CLI Alternative (No SAM)

> These commands create the same resources manually (us-east-2). You can use one deployment zip for all Lambdas and specify different handlers.

### DynamoDB Tables
```bash
aws dynamodb create-table --region us-east-2 \
  --table-name agrismart-community-posts \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions \
    AttributeName=postId,AttributeType=S \
    AttributeName=gsi1pk,AttributeType=S \
    AttributeName=gsi1sk,AttributeType=S \
    AttributeName=gsi2pk,AttributeType=S \
    AttributeName=gsi2sk,AttributeType=S \
  --key-schema AttributeName=postId,KeyType=HASH \
  --global-secondary-indexes '[
    {"IndexName":"GSI1-Feed","KeySchema":[{"AttributeName":"gsi1pk","KeyType":"HASH"},{"AttributeName":"gsi1sk","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
    {"IndexName":"GSI2-UserPosts","KeySchema":[{"AttributeName":"gsi2pk","KeyType":"HASH"},{"AttributeName":"gsi2sk","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
  ]'

aws dynamodb create-table --region us-east-2 \
  --table-name agrismart-community-comments \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions \
    AttributeName=postId,AttributeType=S \
    AttributeName=commentKey,AttributeType=S \
    AttributeName=gsi1pk,AttributeType=S \
    AttributeName=gsi1sk,AttributeType=S \
  --key-schema AttributeName=postId,KeyType=HASH AttributeName=commentKey,KeyType=RANGE \
  --global-secondary-indexes '[
    {"IndexName":"GSI1-UserComments","KeySchema":[{"AttributeName":"gsi1pk","KeyType":"HASH"},{"AttributeName":"gsi1sk","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
  ]'

aws dynamodb create-table --region us-east-2 \
  --table-name agrismart-community-reactions \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions AttributeName=postId,AttributeType=S AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=postId,KeyType=HASH AttributeName=userId,KeyType=RANGE
```

### S3 Bucket
```bash
aws s3api create-bucket --region us-east-2 \
  --bucket agrismart-community-media \
  --create-bucket-configuration LocationConstraint=us-east-2

aws s3api put-public-access-block --region us-east-2 --bucket agrismart-community-media \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-cors --region us-east-2 --bucket agrismart-community-media --cors-configuration '{
  "CORSRules":[{
    "AllowedOrigins":["http://localhost:5173","https://crop-conduit-ui.web.app"],
    "AllowedMethods":["PUT","GET","HEAD"],
    "AllowedHeaders":["*"],
    "MaxAgeSeconds":3000
  }]
}'
```

### IAM Role (single role for all Lambdas)
```bash
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role --region us-east-2 \
  --role-name agrismart-community-lambda-role \
  --assume-role-policy-document file://trust-policy.json

cat > lambda-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-2:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:TransactWriteItems"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-2:*:table/agrismart-community-posts",
        "arn:aws:dynamodb:us-east-2:*:table/agrismart-community-posts/index/*",
        "arn:aws:dynamodb:us-east-2:*:table/agrismart-community-comments",
        "arn:aws:dynamodb:us-east-2:*:table/agrismart-community-comments/index/*",
        "arn:aws:dynamodb:us-east-2:*:table/agrismart-community-reactions"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::agrismart-community-media/*"
    }
  ]
}
EOF

aws iam put-role-policy --region us-east-2 \
  --role-name agrismart-community-lambda-role \
  --policy-name agrismart-community-policy \
  --policy-document file://lambda-policy.json
```

### Package the Lambda Code
```bash
cd backend
npm install --production

# PowerShell (Windows)
Compress-Archive -Path src,package.json,node_modules -DestinationPath function.zip -Force
```

### Create Lambda Functions
```bash
ROLE_ARN=$(aws iam get-role --region us-east-2 --role-name agrismart-community-lambda-role --query Role.Arn --output text)

aws lambda create-function --region us-east-2 \
  --function-name agrismart-create-post \
  --runtime nodejs20.x \
  --handler handlers/createPost.handler \
  --role $ROLE_ARN \
  --zip-file fileb://function.zip \
  --environment "Variables={POSTS_TABLE=agrismart-community-posts,COMMENTS_TABLE=agrismart-community-comments,REACTIONS_TABLE=agrismart-community-reactions,MEDIA_BUCKET=agrismart-community-media,FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,ALLOWED_ORIGINS=http://localhost:5173,https://crop-conduit-ui.web.app}"

aws lambda create-function --region us-east-2 \
  --function-name agrismart-list-posts \
  --runtime nodejs20.x \
  --handler handlers/listPosts.handler \
  --role $ROLE_ARN \
  --zip-file fileb://function.zip \
  --environment "Variables={POSTS_TABLE=agrismart-community-posts,COMMENTS_TABLE=agrismart-community-comments,REACTIONS_TABLE=agrismart-community-reactions,MEDIA_BUCKET=agrismart-community-media,FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,ALLOWED_ORIGINS=http://localhost:5173,https://crop-conduit-ui.web.app}"

aws lambda create-function --region us-east-2 \
  --function-name agrismart-get-post \
  --runtime nodejs20.x \
  --handler handlers/getPost.handler \
  --role $ROLE_ARN \
  --zip-file fileb://function.zip \
  --environment "Variables={POSTS_TABLE=agrismart-community-posts,COMMENTS_TABLE=agrismart-community-comments,REACTIONS_TABLE=agrismart-community-reactions,MEDIA_BUCKET=agrismart-community-media,FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,ALLOWED_ORIGINS=http://localhost:5173,https://crop-conduit-ui.web.app}"

aws lambda create-function --region us-east-2 \
  --function-name agrismart-create-comment \
  --runtime nodejs20.x \
  --handler handlers/createComment.handler \
  --role $ROLE_ARN \
  --zip-file fileb://function.zip \
  --environment "Variables={POSTS_TABLE=agrismart-community-posts,COMMENTS_TABLE=agrismart-community-comments,REACTIONS_TABLE=agrismart-community-reactions,MEDIA_BUCKET=agrismart-community-media,FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,ALLOWED_ORIGINS=http://localhost:5173,https://crop-conduit-ui.web.app}"

aws lambda create-function --region us-east-2 \
  --function-name agrismart-list-comments \
  --runtime nodejs20.x \
  --handler handlers/listComments.handler \
  --role $ROLE_ARN \
  --zip-file fileb://function.zip \
  --environment "Variables={POSTS_TABLE=agrismart-community-posts,COMMENTS_TABLE=agrismart-community-comments,REACTIONS_TABLE=agrismart-community-reactions,MEDIA_BUCKET=agrismart-community-media,FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,ALLOWED_ORIGINS=http://localhost:5173,https://crop-conduit-ui.web.app}"

aws lambda create-function --region us-east-2 \
  --function-name agrismart-toggle-reaction \
  --runtime nodejs20.x \
  --handler handlers/toggleReaction.handler \
  --role $ROLE_ARN \
  --zip-file fileb://function.zip \
  --environment "Variables={POSTS_TABLE=agrismart-community-posts,COMMENTS_TABLE=agrismart-community-comments,REACTIONS_TABLE=agrismart-community-reactions,MEDIA_BUCKET=agrismart-community-media,FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,ALLOWED_ORIGINS=http://localhost:5173,https://crop-conduit-ui.web.app}"

aws lambda create-function --region us-east-2 \
  --function-name agrismart-presign-upload \
  --runtime nodejs20.x \
  --handler handlers/presignUpload.handler \
  --role $ROLE_ARN \
  --zip-file fileb://function.zip \
  --environment "Variables={POSTS_TABLE=agrismart-community-posts,COMMENTS_TABLE=agrismart-community-comments,REACTIONS_TABLE=agrismart-community-reactions,MEDIA_BUCKET=agrismart-community-media,FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,ALLOWED_ORIGINS=http://localhost:5173,https://crop-conduit-ui.web.app}"
```

### Create HTTP API + Routes
```bash
API_ID=$(aws apigatewayv2 create-api --region us-east-2 \
  --name agrismart-community-api \
  --protocol-type HTTP \
  --cors-configuration 'AllowOrigins=http://localhost:5173|https://crop-conduit-ui.web.app,AllowHeaders=Authorization|Content-Type,AllowMethods=GET|POST|OPTIONS' \
  --query ApiId --output text)

# Integrations
CREATE_POST_INT=$(aws apigatewayv2 create-integration --region us-east-2 --api-id $API_ID \
  --integration-type AWS_PROXY --integration-uri arn:aws:lambda:us-east-2:$(aws sts get-caller-identity --query Account --output text):function:agrismart-create-post \
  --payload-format-version 2.0 --query IntegrationId --output text)

LIST_POSTS_INT=$(aws apigatewayv2 create-integration --region us-east-2 --api-id $API_ID \
  --integration-type AWS_PROXY --integration-uri arn:aws:lambda:us-east-2:$(aws sts get-caller-identity --query Account --output text):function:agrismart-list-posts \
  --payload-format-version 2.0 --query IntegrationId --output text)

GET_POST_INT=$(aws apigatewayv2 create-integration --region us-east-2 --api-id $API_ID \
  --integration-type AWS_PROXY --integration-uri arn:aws:lambda:us-east-2:$(aws sts get-caller-identity --query Account --output text):function:agrismart-get-post \
  --payload-format-version 2.0 --query IntegrationId --output text)

CREATE_COMMENT_INT=$(aws apigatewayv2 create-integration --region us-east-2 --api-id $API_ID \
  --integration-type AWS_PROXY --integration-uri arn:aws:lambda:us-east-2:$(aws sts get-caller-identity --query Account --output text):function:agrismart-create-comment \
  --payload-format-version 2.0 --query IntegrationId --output text)

LIST_COMMENT_INT=$(aws apigatewayv2 create-integration --region us-east-2 --api-id $API_ID \
  --integration-type AWS_PROXY --integration-uri arn:aws:lambda:us-east-2:$(aws sts get-caller-identity --query Account --output text):function:agrismart-list-comments \
  --payload-format-version 2.0 --query IntegrationId --output text)

TOGGLE_REACTION_INT=$(aws apigatewayv2 create-integration --region us-east-2 --api-id $API_ID \
  --integration-type AWS_PROXY --integration-uri arn:aws:lambda:us-east-2:$(aws sts get-caller-identity --query Account --output text):function:agrismart-toggle-reaction \
  --payload-format-version 2.0 --query IntegrationId --output text)

PRESIGN_INT=$(aws apigatewayv2 create-integration --region us-east-2 --api-id $API_ID \
  --integration-type AWS_PROXY --integration-uri arn:aws:lambda:us-east-2:$(aws sts get-caller-identity --query Account --output text):function:agrismart-presign-upload \
  --payload-format-version 2.0 --query IntegrationId --output text)

# Routes
aws apigatewayv2 create-route --region us-east-2 --api-id $API_ID --route-key "POST /community/posts" --target integrations/$CREATE_POST_INT
aws apigatewayv2 create-route --region us-east-2 --api-id $API_ID --route-key "GET /community/posts" --target integrations/$LIST_POSTS_INT
aws apigatewayv2 create-route --region us-east-2 --api-id $API_ID --route-key "GET /community/posts/{postId}" --target integrations/$GET_POST_INT
aws apigatewayv2 create-route --region us-east-2 --api-id $API_ID --route-key "POST /community/posts/{postId}/comments" --target integrations/$CREATE_COMMENT_INT
aws apigatewayv2 create-route --region us-east-2 --api-id $API_ID --route-key "GET /community/posts/{postId}/comments" --target integrations/$LIST_COMMENT_INT
aws apigatewayv2 create-route --region us-east-2 --api-id $API_ID --route-key "POST /community/posts/{postId}/reactions" --target integrations/$TOGGLE_REACTION_INT
aws apigatewayv2 create-route --region us-east-2 --api-id $API_ID --route-key "POST /community/uploads/presign" --target integrations/$PRESIGN_INT

# Stage
aws apigatewayv2 create-stage --region us-east-2 --api-id $API_ID --stage-name \$default --auto-deploy
```

### Allow API to Invoke Lambda
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
API_ARN=arn:aws:execute-api:us-east-2:$ACCOUNT_ID:$API_ID/*/*/*

for FN in agrismart-create-post agrismart-list-posts agrismart-get-post agrismart-create-comment agrismart-list-comments agrismart-toggle-reaction agrismart-presign-upload; do
  aws lambda add-permission --region us-east-2 \
    --function-name $FN \
    --statement-id "apigw-$FN" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn $API_ARN
 done
```

### API Base URL
```
https://$API_ID.execute-api.us-east-2.amazonaws.com
```

---

## 9) Checklist (Everything Working)
- [ ] SAM deploy succeeded in `us-east-2`
- [ ] DynamoDB tables exist with GSIs
- [ ] S3 bucket is private and has correct CORS
- [ ] `FIREBASE_PROJECT_ID` set on all Lambda functions
- [ ] `ALLOWED_ORIGINS` includes localhost + production frontend
- [ ] `POST /community/uploads/presign` returns a URL and key
- [ ] Able to PUT an image to S3 using the presigned URL
- [ ] `POST /community/posts` creates a post
- [ ] `GET /community/posts` returns latest posts
- [ ] `POST /community/posts/{postId}/comments` increments commentCount
- [ ] `POST /community/posts/{postId}/reactions` toggles like and updates reactionCount
- [ ] CORS headers present for frontend domains
- [ ] Budget alert configured and API throttling enabled
## Direct Messaging & Calling (AWS)

### Env vars (SAM)
- DM_CONVERSATIONS_TABLE
- DM_MESSAGES_TABLE
- DM_CONTACT_REQUESTS_TABLE
- DM_BLOCKS_TABLE

### Example requests

```bash
API_BASE_URL=https://6cxhk3brli.execute-api.us-east-2.amazonaws.com
FIREBASE_ID_TOKEN=<firebase-id-token>

# Create/find conversation
curl -sS -X POST "$API_BASE_URL/dm/conversations" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherUid":"USER_B_UID"}'

# List conversations
curl -sS "$API_BASE_URL/dm/conversations" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN"

# Send message
curl -sS -X POST "$API_BASE_URL/dm/conversations/USER_A_UID#USER_B_UID/messages" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","otherUid":"USER_B_UID"}'

# List messages
curl -sS "$API_BASE_URL/dm/conversations/USER_A_UID#USER_B_UID/messages" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN"

# Contact request
curl -sS -X POST "$API_BASE_URL/dm/contact-requests" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUid":"USER_B_UID"}'

# Accept request
curl -sS -X PUT "$API_BASE_URL/dm/contact-requests/accept" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherUid":"USER_B_UID","requestId":"REQUEST_ID"}'

# Reject request
curl -sS -X PUT "$API_BASE_URL/dm/contact-requests/reject" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherUid":"USER_B_UID","requestId":"REQUEST_ID"}'

# Contact status
curl -sS "$API_BASE_URL/dm/contact-status/USER_B_UID" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN"

# Block
curl -sS -X POST "$API_BASE_URL/dm/blocks" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blockedUid":"USER_B_UID"}'

# Unblock
curl -sS -X DELETE "$API_BASE_URL/dm/blocks/USER_B_UID" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN"
```
