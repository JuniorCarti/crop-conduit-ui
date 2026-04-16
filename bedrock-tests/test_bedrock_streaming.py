import boto3

client = boto3.client("bedrock-runtime", region_name="us-east-1")

# Use case: Stream responses in real-time
response = client.converse_stream(
    modelId="us.anthropic.claude-haiku-4-5-20251001-v1:0",
    messages=[{
        "role": "user",
        "content": "List 5 climate risks for farmers in Kenya"
    }]
)

# Stream and print output in real-time
for event in response["stream"]:
    if "contentBlockDelta" in event:
        print(event["contentBlockDelta"]["delta"]["text"], end="", flush=True)

print()
