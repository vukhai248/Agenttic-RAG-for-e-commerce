from typing import List, Dict, Any, Optional

class LLMService:
    def __init__(self, settings, config):
        self.settings = settings
        self.config = config

    def call_groq(self, model, messages: list, tools: list = None):
        from groq import Groq

        client = Groq(api_key=self.settings.GROQ_API_KEY)

        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": self.config.generation.temperature,
            "max_completion_tokens": self.config.generation.max_tokens,
            "top_p": self.config.generation.top_p,
            "reasoning_effort": self.config.generation.reasoning_effort,
            "stream": self.config.generation.stream,
            "stop": self.config.generation.stop
        }

        if tools:
            kwargs["tools"] = tools
            # TODO: Sau này nếu cần ép buộc gọi tool ("required"), tắt gọi tool ("none"),
            # hoặc chỉ định đích danh hàm cụ thể, hãy mở lại tham số tool_choice ở signature
            # và uncomment 2 dòng dưới đây để truyền lên API Groq.
            # if tool_choice:
            #     kwargs["tool_choice"] = tool_choice

        completion = client.chat.completions.create(**kwargs)
        return completion

    def _extract_system_instruction(self, messages: list) -> Optional[str]:
        """
        Gom toàn bộ system prompt thành một chuỗi.
        Gemini sử dụng system_instruction thay vì message role="system".
        Trả về None nếu không có system message để tránh lỗi validation API Gemini.
        """
        system_messages = [
            msg["content"]
            for msg in messages
            if msg.get("role") == "system"
            and msg.get("content")
        ]

        return "\n".join(system_messages) if system_messages else None

    def _to_gemini_contents(self, messages: list):
        from google.genai import types
        contents = []
        for msg in messages:
            role = msg.get("role")
            text = msg.get("content")
            # Gemini không nhận system trong contents
            if role == "system":
                continue
            # Không có content thì bỏ qua
            if not text:
                continue
            # assistant -> model (đúng chuẩn Gemini)
            if role == "assistant":
                gemini_role = "model"
            elif role == "user":
                gemini_role = "user"
            else:
                # Sau này tool/function thì xử lý riêng
                continue
            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=[
                        types.Part.from_text(text=text)
                    ]
                )
            )
        return contents

    def _map_thinking_level(self, reasoning_effort: Optional[str]) -> str:
        """
        Vấn đề 2: Chuyển đổi giá trị reasoning_effort của Groq/config.yaml
        sang chuẩn thinking_level của Gemini ThinkingConfig (phải viết HOA).
        """
        mapping = {
            "none":    "NONE",
            "default": "MINIMAL",
            "low":     "LOW",
            "medium":  "MEDIUM",
            "high":    "HIGH",
        }
        # Nếu giá trị đã là uppercase (như "HIGH", "MINIMAL"), giữ nguyên
        raw = (reasoning_effort or "default").strip().lower()
        return mapping.get(raw, "MINIMAL")

    def call_gemini(self, model, messages: list, tools: list = None):
        from google.genai import types

        client = self._get_gemini_client()

        contents = self._to_gemini_contents(messages)
        system_instruction = self._extract_system_instruction(messages)

        generate_content_config = types.GenerateContentConfig(
            temperature=self.config.generation.temperature,
            max_output_tokens=self.config.generation.max_tokens,
            top_p=self.config.generation.top_p,
            thinking_config=types.ThinkingConfig(
                thinking_level=self._map_thinking_level(self.config.generation.reasoning_effort)
            ),
        )

        if tools:
            generate_content_config.tools = tools

        if system_instruction:
            generate_content_config.system_instruction = system_instruction

        if self.config.generation.stream:
            return client.models.generate_content_stream(
                model=model,
                contents=contents,
                config=generate_content_config,
            )

        return client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )