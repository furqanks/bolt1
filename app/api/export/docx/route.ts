import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return NextResponse.json({ 
    ok: true, 
    message: "DOCX export feature coming soon! Your paper will be formatted with proper academic styling." 
  });
}