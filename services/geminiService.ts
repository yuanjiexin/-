import { AnalysisResult } from "../types";

export const analyzeDesignDiscrepancies = async (
  designImageBase64: string,
  devImageBase64: string
): Promise<AnalysisResult> => {

  const systemInstruction = `
    You are an expert Frontend QA Engineer and UI/UX Designer with pixel-perfect vision.
    
    Your task is to compare two images:
    1. The Design Mockup (Target).
    2. The Development Screenshot (Implementation).
    
    Identify visual discrepancies between the implementation and the design. 
    
    CRITICAL INSTRUCTION - IGNORE COPY TEXT:
    - DO NOT report spelling mistakes or different text content (e.g., "Lorem Ipsum" vs real text is OK).
    - ONLY report if the *font family*, *font size*, *font weight*, or *text color* is wrong.
    
    STRICT VISUAL & STYLE CHECK:
    - **Color Accuracy**: STRICTLY check text colors, especially for **secondary text**, **table headers**, **list subtitles**, and **muted labels**. Even subtle shade differences in gray (e.g., #666 vs #999) MUST be reported as Style issues.
    - **Spacing & Alignment**: Check padding inside buttons, cards, and table cells. Check vertical alignment of text.
    - **Element States**: Check if borders, shadows, or background colors match exactly.
    
    CATEGORIZE ISSUES:
    - Layout: Alignment, Spacing (margin/padding), Position, Size, Aspect Ratio.
    - Style: Color, Font (style/weight/size), Shadow, Border, Opacity, Gradient.
    - Content: Missing elements, Wrong icons, Wrong images (NOT text content).
    
    SPLIT COMPOUND ISSUES (CRITICAL):
    - **Separate Content and Style**: If an element has both a content error (e.g. wrong icon) and a style error (e.g. wrong color), report them as TWO SEPARATE issues.
    - **Separate Style and Layout**: If an element has both a style error (e.g. wrong font) and a layout error (e.g. wrong padding), report them as TWO SEPARATE issues.
    - Ensure each issue has a specific, single category.
    - Example: A button has the wrong background color (Style) and the wrong icon (Content).
      - Output Issue 1: Category="Style", Title="Button Color Mismatch".
      - Output Issue 2: Category="Content", Title="Button Icon Mismatch".
    
    OUTPUT RULES:
    1. Language: All text fields MUST be in Simplified Chinese (简体中文).
    2. Severity: "High" (Broken layout, wrong colors), "Medium" (Spacing/Sizing off), "Low" (Minor polish).
    3. Category: Must be one of "Layout", "Style", "Content".
    4. Bounding Boxes: Accurately draw the bounding box around the discrepancy **ON THE DEVELOPMENT SCREENSHOT**. Returns as [ymin, xmin, ymax, xmax] on a 1000x1000 scale.
  `;

  try {
    // Pre-flight: check server health and key presence
    try {
      const h = await fetch('/api/health');
      if (h.ok) {
        const j = await h.json();
        if (!j.hasKey) {
          throw new Error('分析失败：服务端未配置 DASHSCOPE_API_KEY');
        }
      }
    } catch {}

    const url = '/api/analyze';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designImageBase64, devImageBase64, systemInstruction })
    });

    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch {}

    if (data && data.error) {
      const msg = data.error.message || data.error.type || '分析服务返回错误';
      throw new Error(`分析失败：${msg}`);
    }
    if (data && data.summary && Array.isArray(data.issues)) {
      return data as AnalysisResult;
    }
    if (!res.ok) {
      const isHtml = /^\s*<html/i.test(text);
      const gateway = /bad gateway/i.test(text);
      if (gateway || isHtml) {
        throw new Error('分析失败：网关 502（Bad Gateway）。请检查出站网络或模型服务可达性');
      }
      throw new Error(text || '分析服务请求失败');
    }
    throw new Error('Unexpected response from analyze function');
  } catch (error: any) {
    const msg = typeof error?.message === 'string' ? error.message : String(error);
    console.error('Analyze Function Error:', msg);
    throw new Error(msg);
  }
};
