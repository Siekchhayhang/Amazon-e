import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import {
  getNewestProducts,
  getShopLocation,
  getTopSellingProducts,
} from '@/lib/actions/ai.actions';
import { NextResponse } from 'next/server';
import { GOOGLE_API_KEY } from '@/lib/constants';

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY!);

const tools = [
  {
    functionDeclarations: [
      {
        name: 'getNewestProducts',
        description: 'Get the 4 newest products.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: 'getTopSellingProducts',
        description: 'Get the 4 top selling products.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: 'getShopLocation',
        description: 'Get the location of the shop.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
    ],
  },
];

const toolFunctions: Record<string, (args: object) => unknown> = {
  getNewestProducts,
  getTopSellingProducts,
  getShopLocation,
};

const suggestedPrompts = [
  'What are the newest products?',
  'Show me the top selling products.',
  'Where is your shop located?',
];

export async function GET() {
  return NextResponse.json({ prompts: suggestedPrompts });
}
export async function POST(req: Request) {
  const { messages } = await req.json();

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    tools,
  });

  const chat = model.startChat();
  const lastMessage = messages[messages.length - 1].content;

  // Make the initial call to the model
  const result = await chat.sendMessageStream(lastMessage);

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          controller.enqueue(chunkText);
        }

        const functionCalls = chunk.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
          const functionCall = functionCalls[0];
          const toolFunction = toolFunctions[functionCall.name];

          if (toolFunction) {
            const args = functionCall.args;
            // 1. Execute the function to get the data (the raw JSON)
            const toolResult = await toolFunction(args);

            // 2. THIS IS THE FIX: Send the data BACK to the model
            const finalResultStream = await chat.sendMessageStream([
              {
                functionResponse: {
                  name: functionCall.name,
                  response: {
                    name: functionCall.name,
                    content: toolResult,
                  },
                },
              },
            ]);

            // 3. Now, stream the model's *natural language response*
            for await (const finalChunk of finalResultStream.stream) {
              controller.enqueue(finalChunk.text());
            }
          }
        }
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