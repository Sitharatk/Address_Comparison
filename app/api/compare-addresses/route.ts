import { NextResponse ,NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { address1, address2 } = await req.json();

    // Validate input
    if (!address1 || !address2) {
      return NextResponse.json(
        { error: "Both addresses are required." },
        { status: 400 }
      );
    }

    // Check for API key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing Google Gemini API Key." },
        { status: 500 }
      );
    }

    // Construct the prompt
    const prompt = `
    Compare the following two addresses and determine if they refer to the same location:
    - Address 1: ${address1}
    - Address 2: ${address2}

    Respond with a JSON object in the following format:
    {
      "match": boolean, // true if the addresses refer to the same location, false otherwise
      "confidence": number, // a confidence score between 0 and 1
      "reasoning": string // a brief explanation of your analysis
    }

    Only return the JSON object, nothing else.
    `;

    // Call the Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Failed to call Google Gemini API." },
        { status: 500 }
      );
    }

    // Parse the response
    const data = await response.json();
    if (!data || !data.candidates || data.candidates.length === 0) {
      return NextResponse.json(
        { error: "Invalid response from Google Gemini API." },
        { status: 500 }
      );
    }

    // Extract the generated text
    const generatedText = data.candidates[0].content.parts[0].text;

    // Extract JSON from the Markdown code block (if present)
    const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : generatedText;

    // Parse the JSON string
    let output;
    try {
      output = JSON.parse(jsonString);
    } catch (error) {
      console.error("Failed to parse Gemini response:", jsonString);
      return NextResponse.json(
        { error: "Invalid JSON response from Gemini." },
        { status: 500 }
      );
    }

    // Validate the output structure
    if (
      typeof output.match !== "boolean" ||
      typeof output.confidence !== "number" ||
      typeof output.reasoning !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid response format from Gemini." },
        { status: 500 }
      );
    }

    // Return the output
    return NextResponse.json(output);
  } catch (error) {
    console.error("Internal server error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}