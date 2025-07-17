import React, { useState } from 'react';
import { Flex, Box, Text, Input, Button, Loader, Card } from '@/ui';
import ChatBotIcon from '@/icons/ChatBotIcon';
import type { Component } from '@/types';

type Message = { role: 'user' | 'bot'; content: string };

const Chatbot: Component = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`https://vbc-dtxp-review-tool-api.hcb-dev.aig.aetna.com/chat?message=${encodeURIComponent(input)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const botMessage: Message = { role: 'bot', content: data.data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Sorry, something went wrong. Try again.' } as Message]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger icon - position fixed bottom-right, match page style */}
      <Box
        as="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 cursor-pointer rounded-full bg-blue-600 p-3 shadow-md hover:bg-blue-700 transition-colors"
      >
        <ChatBotIcon width="24" height="24" fill="white" />
      </Box>

      {/* Chat window - shown when open, fixed position, match page with white bg, subtle borders */}
      {isOpen && (
        <Flex
          direction="column"
          className="fixed bottom-20 right-4 w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
        >
          {/* Header - blue to match accents */}
          <Box className="bg-blue-600 p-3 text-white font-medium text-lg">
            <Text>Chatbot</Text>
          </Box>

          {/* Message list - scrollable, with padding */}
          <Flex direction="column" gap="2" className="flex-1 overflow-y-auto p-3 bg-gray-50">
            {messages.map((msg, index) => (
              <Box
                key={index}
                className={`max-w-[80%] p-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-gray-200 text-black self-end'
                    : 'bg-blue-100 text-black self-start'
                }`}
              >
                <Text className="text-sm">{msg.content}</Text>
              </Box>
            ))}
            {isLoading && <Loader className="self-center" />}
          </Flex>

          {/* Input row - with border top */}
          <Flex direction="row" align="center" className="p-2 border-t border-gray-200 bg-white">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input}
              className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </Button>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default Chatbot;