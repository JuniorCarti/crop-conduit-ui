import boto3

client = boto3.client("bedrock-runtime", region_name="us-east-1")

# Use case: Generate text from prompts and instructions
response = client.converse(
    modelId="us.anthropic.claude-haiku-4-5-20251001-v1:0",
    messages=[{
        "role": "user",
        "content": "Generate a farming tip for planting tomatoes in East Africa"
    }]
)

print(response["output"]["message"]["content"][0]["text"])
