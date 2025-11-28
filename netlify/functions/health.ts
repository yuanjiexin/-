import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  const sanitize = (v?: string | null) => (v ? v.trim().replace(/^['"`]+|['"`]+$/g, "") : null);
  const hasKey = Boolean(process.env.DASHSCOPE_API_KEY || process.env.VITE_DASHSCOPE_API_KEY);
  const endpoint = sanitize(process.env.DASHSCOPE_ENDPOINT || process.env.VITE_DASHSCOPE_ENDPOINT);
  const model = sanitize(process.env.DASHSCOPE_MODEL || process.env.VITE_DASHSCOPE_MODEL);
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hasKey, endpoint, model })
  };
};
