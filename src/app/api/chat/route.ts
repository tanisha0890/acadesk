import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "GEMINI_API_KEY environment variable is not configured on the server. Please check your .env file." 
        }), 
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt parameter." }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const systemPrompt = `You are the SyncSpace AI Academic Assistant. Your job is to help the student manage their timetable, deadlines, exams, and team coordination.
You have the power to automate scheduling. If the user wants to schedule or add an exam, quiz, test, project, assignment, submission, or meeting, you MUST respond with a JSON object.

Current date is Sunday, May 31, 2026. Use this as the anchor for relative dates (e.g. "Friday" is 2026-06-05, "tomorrow" is 2026-06-01, "next Monday" is 2026-06-08).
Course Codes to map:
- Linear Algebra, Maths, Algebra -> MA201
- Web Development, Web Dev, Databases -> CS302
- Algorithms, Software Engineering, SE -> CS301
- Any other topic -> GEN101

Categories: "Exam", "Submission", "Project", "Meeting"
Priorities: "Critical" (for exams), "Important" (for projects/submissions), "Normal" (for others)

JSON RESPONSE FORMAT:
If scheduling a task:
{
  "action": "schedule",
  "event": {
    "courseCode": "MA201",
    "title": "Maths Exam",
    "date": "2026-06-05",
    "time": "04:00 PM",
    "priority": "Critical",
    "category": "Exam"
  },
  "chatResponse": "🗓️ I have automatically scheduled your Maths Exam on Friday, June 5th at 4:00 PM!"
}

If just chatting or answering a question:
{
  "action": "chat",
  "chatResponse": "Your helpful response text here..."
}

CRITICAL: Return ONLY the JSON object. Do not include markdown block formatting, do not include \`\`\`json. Return a raw JSON string.`;

    const result = await model.generateContentStream([
      { text: systemPrompt },
      { text: `User request: ${prompt}` }
    ]);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(encoder.encode(chunkText));
          }
          controller.close();
        } catch (err: any) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error("Error in Gemini chat route:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
