import boto3

client = boto3.client("bedrock-runtime", region_name="us-east-1")  

# Load image from file 
with open("image.jpg", "rb") as f: 
    image_bytes = f.read()  

response = client.converse( 
    modelId="us.anthropic.claude-haiku-4-5-20251001-v1:0", 
    messages=[{ 
        "role": "user", 
        "content": [ 
            { "image": { 
                  "format": "jpeg", 
                  "source": {"bytes": image_bytes} 
               } 
            }, 
            {"text": "What is in this image?"}
        ] 
    }] 
)  
print(response["output"]["message"]["content"][0]["text"])