import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { notes } = req.body;

    if (!notes || notes.trim() === "") {
      return res.status(400).json({
        error: "Whiteboard is empty.",
      });
    }


    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      temperature: 0.2,

      messages: [
        {
          role: "system",
          content: `
You are DrawDock AI.

Your task is to transform raw whiteboard notes into beautiful, organized meeting notes.

Rules:
- Use Markdown.
- Use ONE relevant emoji per major section (📌 📝 ✅ 💡 📅 🚀 ⚠️).
- Use **bold** for important keywords.
- Use *italics* sparingly for emphasis.
- Use headings and subheadings.
- Use bullet points for readability.
- Preserve all important information.
- Merge duplicate ideas.
- NEVER add information that is not present.
- NEVER explain concepts like a textbook.
- NEVER greet the user.
- Return ONLY the formatted notes.
- Use Markdown formatting.
- Use normal bullet points (-) for lists.
- Never use Markdown task lists ([ ]) use (->) instead.

Example style:

# 📌 Project Planning

## 🎯 Goals
- **Deploy** DrawDock on Vercel.
- Integrate **AI Notes**.

## ✅ Tasks
- -> Finish Chrome Extension
- -> Test collaboration
- -> Deploy website

## 💡 Notes
- Use **Groq** for AI summarization.
- Keep the extension lightweight.
`,
        },
        {
          role: "user",
          content: `Whiteboard text:

${notes}`,
        },
      ],
    });



    const summary =
      completion?.choices?.[0]?.message?.content ??
      "No summary generated.";

    return res.status(200).json({
      summary,
    });
  } catch (err) {
    console.error("========== ERROR ==========");
    console.error(err);

    return res.status(500).json({
      error: err.message || "AI summarization failed.",
    });
  }
}