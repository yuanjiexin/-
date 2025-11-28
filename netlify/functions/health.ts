import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  const hasKey = Boolean(process.env.DASHSCOPE_API_KEY || process.env.VITE_DASHSCOPE_API_KEY);
  const endpoint = process.env.DASHSCOPE_ENDPOINT || process.env.VITE_DASHSCOPE_ENDPOINT || null;
  const model = process.env.DASHSCOPE_MODEL || process.env.VITE_DASHSCOPE_MODEL || null;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hasKey, endpoint, model })
  };
};

