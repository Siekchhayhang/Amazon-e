// /app/api/chat/route.ts
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';
import {
  getNewestProducts,
  getShopLocation,
  getTopSellingProducts,
} from '@/lib/actions/ai.actions';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('models/gemini-pro'),
    messages,
    tools: {
      getNewestProducts: {
        description: 'Get the 4 newest products',
        parameters: z.object({}),
        execute: async () => await getNewestProducts(),
      },
      getTopSellingProducts: {
        description: 'Get the 4 top selling products',
        parameters: z.object({}),
        execute: async () => await getTopSellingProducts(),
      },
      getShopLocation: {
        description: 'Get the location of the shop',
        parameters: z.object({}),
        execute: async () => await getShopLocation(),
      },
    },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const delta of result.textStream) {
        controller.enqueue(encoder.encode(delta));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
