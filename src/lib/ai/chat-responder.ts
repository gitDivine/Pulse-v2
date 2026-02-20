import { formatNaira } from "@/lib/utils/format";

interface Product {
  name: string;
  price: number;
  stock_quantity: number;
  description: string | null;
}

interface AIContext {
  buyerMessage: string;
  products: Product[];
  businessName: string;
  businessCategory: string;
}

// Template responses as fallback when AI APIs are unavailable
const TEMPLATES = {
  greeting: (name: string) =>
    `Welcome to ${name}! How can I help you today? You can ask about our products, prices, or availability.`,
  product_list: (name: string, products: Product[]) =>
    `Here are some products available at ${name}:\n\n${products
      .slice(0, 5)
      .map((p) => `• ${p.name} — ${formatNaira(p.price)}${p.stock_quantity > 0 ? "" : " (Out of stock)"}`)
      .join("\n")}\n\nWould you like to know more about any of these?`,
  out_of_stock: (productName: string) =>
    `Sorry, ${productName} is currently out of stock. Would you like to be notified when it's back, or can I suggest something similar?`,
  price_query: (product: Product) =>
    `${product.name} is ${formatNaira(product.price)}. ${product.stock_quantity > 0 ? `We have ${product.stock_quantity} in stock.` : "It's currently out of stock."} Would you like to order?`,
  order_interest: () =>
    `I'd love to help you place an order! Please add items to your cart using the product buttons, then proceed to checkout. The seller will verify availability and send you a payment link.`,
  default: (name: string) =>
    `Thanks for reaching out to ${name}! Let me get back to you on that. In the meantime, feel free to browse our products or ask about availability.`,
};

/**
 * Zone One AI responder — information only, no commitments.
 * Tries Groq first, falls back to Gemini, then to templates.
 */
export async function getAIResponse(context: AIContext): Promise<string> {
  // Try Groq first
  try {
    const response = await callGroq(context);
    if (response) return response;
  } catch {
    // Fall through to Gemini
  }

  // Try Gemini
  try {
    const response = await callGemini(context);
    if (response) return response;
  } catch {
    // Fall through to templates
  }

  // Fallback: smart template matching
  return getTemplateResponse(context);
}

async function callGroq(context: AIContext): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") return null;

  const productContext = context.products
    .map((p) => `- ${p.name}: ${formatNaira(p.price)}, ${p.stock_quantity} in stock${p.description ? `, ${p.description}` : ""}`)
    .join("\n");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a helpful shopping assistant for ${context.businessName}, a ${context.businessCategory} business on PULSE. You ONLY answer product questions, pricing, and availability. You do NOT confirm orders or process payments — that requires the seller. Keep responses short (2-3 sentences max), friendly, and in simple English. If a product is out of stock, say so honestly.\n\nAvailable products:\n${productContext}`,
        },
        { role: "user", content: context.buyerMessage },
      ],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function callGemini(context: AIContext): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") return null;

  const productContext = context.products
    .map((p) => `- ${p.name}: ${formatNaira(p.price)}, ${p.stock_quantity} in stock`)
    .join("\n");

  const prompt = `You are a shopping assistant for ${context.businessName}. Available products:\n${productContext}\n\nBuyer asks: "${context.buyerMessage}"\n\nReply in 2-3 sentences. Be helpful, friendly, simple English. Do NOT confirm orders or payments.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function getTemplateResponse(context: AIContext): string {
  const msg = context.buyerMessage.toLowerCase();

  // Greeting detection
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|howdy)/i.test(msg)) {
    return TEMPLATES.greeting(context.businessName);
  }

  // Product list request
  if (/what (do you|are you) sell|products|catalogue|catalog|menu|what.*available/i.test(msg)) {
    if (context.products.length === 0) {
      return `${context.businessName} is currently updating their product catalogue. Please check back shortly!`;
    }
    return TEMPLATES.product_list(context.businessName, context.products);
  }

  // Price query — find matching product
  if (/how much|price|cost|what.*cost/i.test(msg)) {
    const match = context.products.find((p) =>
      msg.includes(p.name.toLowerCase())
    );
    if (match) return TEMPLATES.price_query(match);
    if (context.products.length > 0) {
      return TEMPLATES.product_list(context.businessName, context.products);
    }
  }

  // Order intent
  if (/order|buy|purchase|want to get|i('d| would) like/i.test(msg)) {
    return TEMPLATES.order_interest();
  }

  return TEMPLATES.default(context.businessName);
}
