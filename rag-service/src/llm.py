from typing import List, Dict, Any, Optional

class LLMService:
    def __init__(self, settings, config):
        self.settings = settings
        self.config = config

        self.openrouter_key = settings.OPENROUTER_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.groq_key = settings.GROQ_API_KEY


    def call_groq(self, model, messages: list):
        from groq import Groq
        client = Groq(api_key=self.settings.GROQ_API_KEY)

        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=self.config.generation.temperature,
            max_completion_tokens=self.config.generation.max_tokens,
            top_p=self.config.generation.top_p,
            reasoning_effort=self.config.generation.reasoning_effort,
            stream=self.config.generation.stream,
            stop=self.config.generation.stop
        )
        return completion