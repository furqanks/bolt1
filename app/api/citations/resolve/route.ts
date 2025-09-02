import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { doi } = await req.json();
  
  if (!doi) {
    return NextResponse.json({ error: "Missing DOI" }, { status: 400 });
  }

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock different responses based on DOI pattern for demo
  const mockResponses = [
    {
      title: "The Impact of Artificial Intelligence on Educational Outcomes: A Systematic Review",
      authors: ["Smith, J. A.", "Johnson, M. K.", "Williams, R. L."],
      journal: "Journal of Educational Technology Research",
      year: "2023",
      volume: "45",
      pages: "123-145",
      url: `https://doi.org/${doi}`,
      doi,
      type: "journal",
    },
    {
      title: "Machine Learning Applications in Academic Writing: Current Trends and Future Directions",
      authors: ["Chen, L.", "Rodriguez, A. M."],
      journal: "Computers & Education",
      year: "2024",
      volume: "198",
      pages: "104-118",
      url: `https://doi.org/${doi}`,
      doi,
      type: "journal",
    },
    {
      title: "Digital Transformation in Higher Education: A Comprehensive Analysis",
      authors: ["Brown, K. S.", "Davis, P. J.", "Thompson, E. R.", "Lee, S. H."],
      journal: "Educational Technology & Society",
      year: "2023",
      volume: "26",
      pages: "89-102",
      url: `https://doi.org/${doi}`,
      doi,
      type: "journal",
    }
  ];

  // Select response based on DOI hash for consistency
  const index = doi.split('').reduce((acc: number, char) => acc + char.charCodeAt(0), 0) % mockResponses.length;
  const metadata = mockResponses[index];

  return NextResponse.json({ metadata });
}