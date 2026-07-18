from groq import Groq

client = Groq(api_key="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")
completion = client.chat.completions.create(
    model="groq/compound",
    messages=[
      {
        "role": "user",
        "content": "Hôm nay có các trận world cup nào?"
      }
    ],
    temperature=1,
    max_completion_tokens=1024,
    top_p=1,
    stream=True,
    stop=None,
    compound_custom={"tools":{"enabled_tools":["web_search","code_interpreter","visit_website"]}}
)

for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")
