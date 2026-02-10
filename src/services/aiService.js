/**
 * AI Service
 * Abstraction layer for Anthropic and OpenAI API interactions
 * Supports streaming responses
 */

/**
 * AI Service class for handling API calls to different providers
 */
export class AIService {
  constructor(provider, apiKey) {
    this.provider = provider;
    this.apiKey = apiKey;
  }

  /**
   * Validate the API key by making a small test request
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateKey() {
    try {
      if (this.provider === 'anthropic') {
        return await this.validateAnthropicKey();
      } else if (this.provider === 'openai') {
        return await this.validateOpenAIKey();
      } else if (this.provider === 'openrouter') {
        return await this.validateOpenRouterKey();
      }
      return { valid: false, error: 'Unknown provider' };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async validateAnthropicKey() {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (response.ok) {
      return { valid: true };
    }

    const errorData = await response.json().catch(() => ({}));

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }
    if (response.status === 403) {
      return { valid: false, error: 'API key lacks required permissions' };
    }
    if (response.status === 429) {
      // Rate limited but key is valid
      return { valid: true };
    }

    return {
      valid: false,
      error: errorData.error?.message || `API error: ${response.status}`,
    };
  }

  async validateOpenAIKey() {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (response.ok) {
      return { valid: true };
    }

    const errorData = await response.json().catch(() => ({}));

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }
    if (response.status === 403) {
      return { valid: false, error: 'API key lacks required permissions' };
    }
    if (response.status === 429) {
      // Rate limited but key is valid
      return { valid: true };
    }

    return {
      valid: false,
      error: errorData.error?.message || `API error: ${response.status}`,
    };
  }

  async validateOpenRouterKey() {
    // OpenRouter uses OpenAI-compatible API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'MDMA Session Guide',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (response.ok) {
      return { valid: true };
    }

    const errorData = await response.json().catch(() => ({}));

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }
    if (response.status === 403) {
      return { valid: false, error: 'API key lacks required permissions' };
    }
    if (response.status === 429) {
      // Rate limited but key is valid
      return { valid: true };
    }

    return {
      valid: false,
      error: errorData.error?.message || `API error: ${response.status}`,
    };
  }

  /**
   * Stream a message response from the AI
   * @param {Array<{role: string, content: string}>} messages - Conversation history
   * @param {string} systemPrompt - System prompt with context
   * @param {string} modelPreference - Model preference ('default' or specific model)
   * @param {AbortSignal} [signal] - Optional AbortSignal for cancellation
   * @yields {string} Text chunks as they arrive
   */
  async *streamMessage(messages, systemPrompt, modelPreference = 'default', signal = null) {
    if (this.provider === 'anthropic') {
      yield* this.streamAnthropic(messages, systemPrompt, modelPreference, signal);
    } else if (this.provider === 'openai') {
      yield* this.streamOpenAI(messages, systemPrompt, modelPreference, signal);
    } else if (this.provider === 'openrouter') {
      yield* this.streamOpenRouter(messages, systemPrompt, modelPreference, signal);
    } else {
      throw new Error('Unknown provider');
    }
  }

  /**
   * Stream from Anthropic API
   */
  async *streamAnthropic(messages, systemPrompt, modelPreference, signal = null) {
    const model =
      modelPreference === 'default' ? 'claude-sonnet-4-5-20250929' : modelPreference;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                yield parsed.delta.text;
              }

              if (parsed.type === 'error') {
                throw new Error(parsed.error?.message || 'Stream error');
              }
            } catch (parseError) {
              // Skip non-JSON lines
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Stream from OpenAI API
   */
  async *streamOpenAI(messages, systemPrompt, modelPreference, signal = null) {
    const model = modelPreference === 'default' ? 'gpt-4o' : modelPreference;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                yield content;
              }
            } catch (parseError) {
              // Skip non-JSON lines
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Non-streaming message (fallback)
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} systemPrompt
   * @returns {Promise<string>}
   */
  async sendMessage(messages, systemPrompt, modelPreference = 'default') {
    if (this.provider === 'anthropic') {
      return this.sendAnthropicMessage(messages, systemPrompt, modelPreference);
    } else if (this.provider === 'openai') {
      return this.sendOpenAIMessage(messages, systemPrompt, modelPreference);
    }
    throw new Error('Unknown provider');
  }

  async sendAnthropicMessage(messages, systemPrompt, modelPreference) {
    const model =
      modelPreference === 'default' ? 'claude-sonnet-4-5-20250929' : modelPreference;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  async sendOpenAIMessage(messages, systemPrompt, modelPreference) {
    const model = modelPreference === 'default' ? 'gpt-4o' : modelPreference;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

/**
 * Stream from OpenRouter API (OpenAI-compatible)
 */
AIService.prototype.streamOpenRouter = async function* (messages, systemPrompt, modelPreference, signal = null) {
  const model = modelPreference === 'default' ? 'meta-llama/llama-3.2-3b-instruct:free' : modelPreference;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'MDMA Session Guide',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              yield content;
            }
          } catch (parseError) {
            // Skip non-JSON lines
            if (parseError instanceof SyntaxError) continue;
            throw parseError;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider) {
  if (provider === 'anthropic') {
    return [
      { id: 'default', label: 'Default (Claude Sonnet 4.5)' },
      { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
      { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
    ];
  }

  if (provider === 'openai') {
    return [
      { id: 'default', label: 'Default (GPT-4o)' },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    ];
  }

  if (provider === 'openrouter') {
    return [
      { id: 'default', label: 'Default (Llama 3.2 Free)' },
      // Free models
      { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (Free)' },
      { id: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (Free)' },
      { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' },
      // Paid open-source models
      { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
      { id: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
      { id: 'mistralai/mixtral-8x22b-instruct', label: 'Mixtral 8x22B' },
      // Claude via OpenRouter
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { id: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
      // GPT via OpenRouter
      { id: 'openai/gpt-4o', label: 'GPT-4o' },
      { id: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
    ];
  }

  return [{ id: 'default', label: 'Default' }];
}

/**
 * Get provider display info
 */
export function getProviderInfo(provider) {
  const providers = {
    anthropic: {
      name: 'Anthropic',
      description: 'Claude models - Direct API',
      keyPlaceholder: 'sk-ant-...',
      keyHelp: 'Get your key at console.anthropic.com',
    },
    openai: {
      name: 'OpenAI',
      description: 'GPT models - Direct API',
      keyPlaceholder: 'sk-...',
      keyHelp: 'Get your key at platform.openai.com',
    },
    openrouter: {
      name: 'OpenRouter',
      description: 'Access 100+ models including free open-source options',
      keyPlaceholder: 'sk-or-...',
      keyHelp: 'Get your key at openrouter.ai (includes free models)',
    },
  };
  return providers[provider] || { name: provider, description: '', keyPlaceholder: '', keyHelp: '' };
}
