import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
  type Schema,
} from '@google/generative-ai';
import {
  getNewestProducts,
  getSuggestionProductPrice,
  getTopSellingProducts,
} from '@/lib/actions/ai.actions';
import { NextResponse } from 'next/server';
import { GOOGLE_API_KEY } from '@/lib/constants';
import { getAllProducts } from '@/lib/actions/product.actions';
import { getAllOrders } from '@/lib/actions/order.actions';

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY!);

const tools: FunctionDeclaration[] = [
  {
    name: 'getNewestProducts',
    description: 'Get the 4 newest products.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    } satisfies Schema,
  },
  {
    name: 'getTopSellingProducts',
    description: 'Get the 4 top selling products.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    } satisfies Schema,
  },
  {
    name: 'getSuggestionProductPrice',
    description: 'Suggest a price for a product.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        productName: {
          type: SchemaType.STRING,
          description: 'The name of the product.',
        },
      },
      required: ['productName'],
    } satisfies Schema,
  },
];

const toolFunctions: Record<string, (args: object) => Promise<unknown>> = {
  getNewestProducts: async () => await getNewestProducts(),
  getTopSellingProducts: async () => await getTopSellingProducts(),
  getSuggestionProductPrice: async (args) =>
    await getSuggestionProductPrice(args as { productName: string }),
};

export async function GET() {
  const { products } = await getAllProducts({
    query: 'all',
    category: 'all',
    tag: 'all',
    page: 1,
    limit: 3,
    sort: 'latest',
    rating: 'all',
  });
  const suggestedPrompts = [
    'What are the newest products?',
    'Show me the top selling products.',
    ...products.map((p) => `Suggest a price for a ${p.name}.`),
  ];
  return NextResponse.json({ prompts: suggestedPrompts });
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;
  const lastMessageLower = lastMessage.toLowerCase();

  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    tools: [{ functionDeclarations: tools }],
    // 👇 1. Set the maximum reply length to 1000 tokens
    generationConfig: { maxOutputTokens: 1000 },
  });

  const chat = model.startChat();
  let result;

  // 👇 2. Check if the user is asking about orders
  if (lastMessageLower.includes('order') || lastMessageLower.includes('sale')) {
    // Fetch the latest orders
    const orderData = await getAllOrders({ page: 1, query: '' });

    // Format the order data into a readable string for the AI
    const orderContext = orderData.data.map(o =>
      `- Order ID: ${o._id}, Customer: ${o.user?.name || 'N/A'}, Total: $${o.totalPrice}, Status: ${o.isPaid ? 'Paid' : 'Unpaid'}`
    ).join('\n');

    // Send the user's message along with the order data as context
    result = await chat.sendMessageStream(
      `System Context: Here is a list of the most recent orders from the database:\n${orderContext}\n\nUser Question: ${lastMessage}`
    );
  } else {
    // Normal chat flow for other questions
    result = await chat.sendMessageStream(lastMessage);
  }

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
            const toolResult = await toolFunction(args);

            // Send the tool result back to the model
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

            // Stream the model's final response
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