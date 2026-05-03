# AI Assistant

An optional AI assistant for session support:

- **Providers**: Supports Anthropic, OpenAI, and OpenRouter APIs
- **Key Storage**: Encrypted with session-based encryption (auto-expires)
- **Context**: Builds system prompts with session state awareness
- **Components**: `AIAssistantModal`, `ChatWindow`, `ChatSidebar`
- **Store**: `useAIStore.js` manages conversations, settings, streaming
