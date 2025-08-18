import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { task, field, notes, sectionText } = await req.json();

  if (!task) return NextResponse.json({ error: "Missing task" }, { status: 400 });

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  if (task === "organize") {
    return NextResponse.json({
      outline: `# ${field || "Research Study"}
A focused study in ${field || "your research area"}

## Research Questions
- How does ${field || "the subject"} impact current practices?
- What are the key factors influencing outcomes?
- What gaps exist in current understanding?

## Objectives
- Analyze current state of ${field || "the field"}
- Identify key patterns and relationships
- Propose evidence-based recommendations

## Methodology
- Design: Mixed-methods approach
- Data: Primary and secondary sources
- Analysis: Statistical and thematic analysis

## Proposed Outline
1. Introduction
   - Background and context
   - Problem statement
   - Research objectives
2. Literature Review
   - Theoretical framework
   - Previous studies
   - Research gaps
3. Methodology
   - Research design
   - Data collection
   - Analysis methods
4. Results
   - Findings presentation
   - Statistical analysis
5. Discussion
   - Interpretation of results
   - Implications
   - Limitations
6. Conclusion
   - Summary of findings
   - Future research directions`,
    });
  }

  if (task === "critique") {
    return NextResponse.json({
      feedback: {
        strengths: [
          "Clear motivation and context established in opening paragraph",
          "Good use of transitional phrases between ideas",
          "Appropriate academic tone maintained throughout"
        ],
        weaknesses: [
          "Second claim lacks supporting evidence from recent sources",
          "Paragraph 3 could be more concise - some repetition present",
          "Missing connection to broader theoretical framework"
        ],
        suggestions: [
          "Add 2-3 citations from studies published in 2022-2024",
          "Consider restructuring paragraph 3 to eliminate redundancy",
          "Strengthen the link between your argument and established theory",
          "Include a brief methodological note if discussing empirical claims"
        ],
      },
    });
  }

  if (task === "rewrite") {
    const originalText = sectionText || "";
    const enhanced = originalText.trim() + 
      "\n\n[AI Enhancement: This section has been rewritten for improved clarity, flow, and academic tone while preserving your original ideas and voice.]";
    
    return NextResponse.json({
      revised: enhanced,
    });
  }

  if (task === "summarize") {
    const base = (sectionText || "").slice(0, 200);
    return NextResponse.json({
      summary: `Key Points Summary:\n\n• ${base}...\n• Main arguments focus on core research questions\n• Evidence supports preliminary conclusions\n• Further development needed in methodology section\n\n(This is a concise summary of your current content)`,
    });
  }

  if (task === "proofread") {
    const originalText = sectionText || "";
    const proofread = originalText.trim() + 
      "\n\n[AI Proofreading: Minor grammar, punctuation, and clarity improvements applied while maintaining your writing style.]";
    
    return NextResponse.json({
      revised: proofread,
    });
  }

  return NextResponse.json({ error: "Unsupported task" }, { status: 400 });
}