import React, { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bubble, GiftedChat, Send } from 'react-native-gifted-chat';
import { readStream, sendChatMessage } from './api';

const USER_ID = 1;
const ASSISTANT_ID = 2;

const DEFAULT_CHARACTER = {
  name: '小易',
  description: '你是 EasyChat 的智能助手，热情、简洁、清晰地回答用户问题。'
};

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const readerRef = useRef(null);

  const buildApiMessages = useCallback((conversationMessages, userText) => {
    const history = conversationMessages
      .filter(item => typeof item.text === 'string' && item.text.trim().length > 0)
      .slice()
      .reverse()
      .map(item => ({
        role: item.user?._id === USER_ID ? 'user' : 'assistant',
        content: item.text
      }));

    return [
      { role: 'system', content: DEFAULT_CHARACTER.description },
      ...history,
      { role: 'user', content: userText }
    ];
  }, []);

  const patchBotMessage = useCallback((botId, text) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message._id === botId ? { ...message, text } : message
      )
    );
  }, []);

  const handleStop = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
    } catch (error) {
      // 忽略取消过程中的异常。
    } finally {
      setIsTyping(false);
    }
  }, []);

  const onSend = useCallback(
    async (newMessages = []) => {
      if (!newMessages.length) return;

      if (isTyping) {
        Alert.alert('提示', '当前正在回复，请先停止当前输出再发送新消息。');
        return;
      }

      const userMsg = newMessages[0];
      const botMsgId = `${Date.now()}-bot`;
      const botPlaceholder = {
        _id: botMsgId,
        text: '',
        createdAt: new Date(Date.now() + 1),
        user: { _id: ASSISTANT_ID, name: DEFAULT_CHARACTER.name }
      };

      const conversationSnapshot = messages;
      setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
      setMessages(previousMessages => GiftedChat.append(previousMessages, [botPlaceholder]));
      setIsTyping(true);

      try {
        const apiMessages = buildApiMessages(conversationSnapshot, userMsg.text);
        const reader = await sendChatMessage(apiMessages, true);
        readerRef.current = reader;

        let botText = '';
        await readStream(
          reader,
          chunk => {
            botText += chunk;
            patchBotMessage(botMsgId, botText);
          },
          () => {
            readerRef.current = null;
            setIsTyping(false);
          }
        );
      } catch (error) {
        Alert.alert('发送失败', error.message);
        setMessages(previousMessages =>
          previousMessages.filter(message => message._id !== botMsgId)
        );
        readerRef.current = null;
        setIsTyping(false);
      }
    },
    [buildApiMessages, isTyping, messages, patchBotMessage]
  );

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: USER_ID, name: '我' }}
        isTyping={isTyping}
        renderBubble={props => (
          <Bubble
            {...props}
            wrapperStyle={{
              right: { backgroundColor: '#6c63ff' },
              left: { backgroundColor: '#2d2d44' }
            }}
            textStyle={{
              right: { color: '#ffffff' },
              left: { color: '#f4f4ff' }
            }}
          />
        )}
        renderSend={props => (
          <View style={styles.sendRow}>
            {isTyping ? (
              <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
                <Text style={styles.stopText}>停止</Text>
              </TouchableOpacity>
            ) : null}
            <Send {...props}>
              <View style={styles.sendButton}>
                <Text style={styles.sendText}>发送</Text>
              </View>
            </Send>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e'
  },
  sendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
    marginBottom: 6
  },
  stopButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#ff6b6b'
  },
  stopText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  sendButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#6c63ff'
  },
  sendText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  }
});
