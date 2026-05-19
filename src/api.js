const CLOUD_FUNCTION_URL =
  process.env.EXPO_PUBLIC_CLOUD_FUNCTION_URL || 'https://你的项目名.vercel.app/api/chat';

export async function sendChatMessage(messages, stream = true) {
  const response = await fetch(CLOUD_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, stream })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`请求失败: ${errText}`);
  }

  if (stream) {
    if (!response.body) {
      throw new Error('当前网络环境不支持流式响应');
    }
    return response.body.getReader();
  }

  return response.json();
}

export async function readStream(reader, onChunk, onDone) {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      onDone?.();
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;

      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') {
        onDone?.();
        return;
      }

      try {
        const json = JSON.parse(dataStr);
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          onChunk?.(content);
        }
      } catch (error) {
        // 忽略单条解析失败，继续读取后续数据。
      }
    }
  }
}
