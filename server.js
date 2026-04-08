import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("."));

app.post("/analyze", async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "No image provided" });

  const prompt = `You are a cybersecurity expert specializing in phishing detection.
Analyze this screenshot carefully.
Look for: suspicious URLs, fake login forms, urgency tactics, brand impersonation, poor grammar, mismatched logos, unusual domain names, or anything designed to steal credentials.
Respond ONLY in this exact JSON format (no extra text):
{
  "verdict": "phishing" or "legitimate",
  "confidence": "high" or "medium" or "low",
  "reason": "one concise sentence explaining why"
}`;

  try {
    const response = await fetch("https://api.moondream.ai/v1/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Moondream-Auth": process.env.MOONDREAM_API_KEY,
      },
      body: JSON.stringify({
        image_url: `data:image/jpeg;base64,${image}`,
        question: prompt,
      }),
    });

    const data = await response.json();
    const raw = data.answer || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse model response");

    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Fund running on http://localhost:3000"));