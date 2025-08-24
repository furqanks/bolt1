import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { task, field, notes, sectionText, wordTarget } = await req.json();

  if (!task) return NextResponse.json({ error: "Missing task" }, { status: 400 });

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Ideate tasks
  if (task === "rqs") {
    return NextResponse.json({
      suggestions: [
        "How does the implementation of AI-powered tools affect student engagement in academic writing?",
        "What are the key barriers to adopting digital research assistants in higher education?",
        "To what extent do structured writing frameworks improve research paper quality?",
        "How do citation management systems impact the accuracy of academic references?"
      ]
    });
  }

  if (task === "hypotheses") {
    return NextResponse.json({
      suggestions: [
        "H1: Students using AI writing assistants will demonstrate 25% improvement in paper structure scores",
        "H2: Automated citation management reduces reference errors by at least 40%",
        "H3: Real-time feedback systems correlate positively with writing confidence levels",
        "H0: There is no significant difference in writing quality between traditional and AI-assisted methods"
      ]
    });
  }

  if (task === "contributions") {
    return NextResponse.json({
      suggestions: [
        "Novel framework for integrating AI feedback in academic writing workflows",
        "Empirical evidence on the effectiveness of structured outline approaches",
        "Comprehensive analysis of citation management impact on research quality",
        "Practical guidelines for implementing AI writing tools in educational settings"
      ]
    });
  }

  // Evidence tasks
  if (task === "suggest_citations") {
    return NextResponse.json({
      citations: [
        {
          title: "AI-Enhanced Academic Writing: A Systematic Review",
          authors: ["Johnson, M.", "Smith, K."],
          year: "2023",
          journal: "Educational Technology Research",
          relevance: "Directly supports your argument about AI effectiveness in academic contexts"
        },
        {
          title: "Digital Tools in Higher Education: Impact and Implementation",
          authors: ["Chen, L.", "Rodriguez, A."],
          year: "2024",
          journal: "Journal of Educational Innovation",
          relevance: "Provides framework for understanding technology adoption in education"
        },
        {
          title: "Citation Management Systems: A Comparative Study",
          authors: ["Brown, R.", "Davis, P."],
          year: "2023",
          journal: "Information Science Quarterly",
          relevance: "Offers empirical data on citation accuracy improvements"
        }
      ]
    });
  }

  if (task === "synthesize_sources") {
    return NextResponse.json({
      synthesis: `Based on recent literature, three key themes emerge regarding AI in academic writing:

**Theme 1: Effectiveness and Outcomes**
Johnson et al. (2023) and Chen & Rodriguez (2024) both demonstrate significant improvements in writing quality when AI tools are properly integrated into academic workflows.

**Theme 2: Implementation Challenges**
While Brown & Davis (2023) highlight technical barriers, recent studies suggest that user training and institutional support are more critical factors.

**Theme 3: Future Directions**
The consensus points toward hybrid approaches that combine AI assistance with traditional pedagogical methods for optimal results.`
    });
  }

  if (task === "spot_gaps") {
    return NextResponse.json({
      gaps: [
        "Limited longitudinal studies on AI writing tool adoption in academic settings",
        "Insufficient research on the impact of AI feedback on student learning outcomes",
        "Gap in understanding cultural differences in AI tool acceptance across institutions",
        "Need for standardized metrics to evaluate AI-assisted writing quality"
      ]
    });
  }

  // Write/Polish tasks
  if (task === "shorten") {
    const target = wordTarget || 100;
    return NextResponse.json({
      revised: `${(sectionText || "").slice(0, target * 6)}... [Shortened to ~${target} words while preserving key arguments and maintaining academic tone]`
    });
  }

  if (task === "expand") {
    const target = wordTarget || 300;
    return NextResponse.json({
      revised: `${sectionText || ""}\n\n[Expanded with additional context, supporting details, and elaborated arguments to reach approximately ${target} words while maintaining coherence and academic rigor]`
    });
  }

  if (task === "bullets_to_paragraph") {
    return NextResponse.json({
      revised: `The research findings indicate several key outcomes. ${(sectionText || "").replace(/[•\-\*]\s*/g, "").replace(/\n/g, " ")} These results collectively demonstrate the effectiveness of the proposed approach and provide a foundation for future research directions.`
    });
  }

  if (task === "paragraph_to_bullets") {
    const sentences = (sectionText || "").split(/[.!?]+/).filter(s => s.trim().length > 10);
    const bullets = sentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n');
    return NextResponse.json({
      revised: bullets || "• Key point extracted from content\n• Additional supporting detail\n• Concluding observation"
    });
  }
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