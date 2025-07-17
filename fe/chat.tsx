import React, { useState } from 'react';
import type { Component } from '@types';
import { Flex, Box, Text, Input, Button, Loader, Card } from '@ui';
import ChatBotIcon from '@icons/ChatBotIcon';

type Message = { role: 'user' | 'bot'; content: string };

const Chatbot: Component = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
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
      const botMessage = { role: 'bot', content: data.data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Sorry, something went wrong. Try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger icon - position fixed bottom-right */}
      <Box
        as="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 cursor-pointer"
        radius="full"
        background="blue"
        padding="2"
        borderColor="transparent"
      >
        <ChatBotIcon width="32" height="32" fill="white" />
      </Box>

      {/* Chat window - shown when open, fixed position */}
      {isOpen && (
        <Flex
          direction="column"
          className="fixed bottom-20 right-4 w-80 h-96 bg-white shadow-lg z-50 overflow-hidden"
          radius="md"
          border="1"
          borderColor="gray-15"
          borderStyle="solid"
        >
          {/* Header */}
          <Box background="blue" padding="3">
            <Text size="title-3" weight="medium" color="white">Chatbot</Text>
          </Box>

          {/* Message list - scrollable */}
          <Flex direction="column" gap="2" padding="3" className="flex-1 overflow-y-auto">
            {messages.map((msg, index) => (
              <Card key={index} radius="sm" background={msg.role === 'user' ? 'gray-5' : 'blue-5'} padding="2">
                <Text size="label-1" color="black">{msg.content}</Text>
              </Card>
            ))}
            {isLoading && <Loader />}
          </Flex>

          {/* Input row */}
          <Flex direction="row" align="center" padding="2" borderT="1" borderColor="gray-15">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button variant="primary" size="sm" onClick={handleSend} disabled={isLoading || !input}>
              Send
            </Button>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default Chatbot;


import { cvsHealthSans } from '@/styles/fonts';
import '@/styles/globals.css';
import { Loader } from '@/ui/Loader';
import type { Layout } from '@/types';
import type { Metadata } from 'next';
import Chatbot from './chat/Chatbot';  // Adjust path if needed based on folder structure

export const metadata: Metadata = {
  title: 'VBC DTXP',
  description: 'Dashboard',
};

const RootLayout: Layout = ({ children }) => (
  <html lang="en" className="cvsHealthSans.variable">
    <body className="antialiased">
      <Suspense fallback={<Loader />}>
        <App>{children}</App>
      </Suspense>
      <Chatbot />  {/* Adds the floating chatbot icon and window globally */}
    </body>
  </html>
);

export default RootLayout;