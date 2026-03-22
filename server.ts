import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/generate", async (req, res) => {
    try {
      const rawApiKey = process.env.OPENROUTER_API_KEY;
      if (!rawApiKey) {
        return res.status(500).json({ error: "OPENROUTER_API_KEY is not set in the environment variables." });
      }

      // Sanitize the API key to remove any hidden/non-ASCII characters
      let apiKey = rawApiKey.replace(/[^\x20-\x7E]/g, '').trim();
      
      // Extract just the actual key if the user accidentally pasted "API_KEY : sk-or-v1-..."
      const keyMatch = apiKey.match(/(sk-or-v1-[a-zA-Z0-9]+)/);
      if (keyMatch) {
        apiKey = keyMatch[1];
      }

      // Ensure the key is exactly what we expect (no weird whitespace)
      apiKey = apiKey.trim();

      const { promptText } = req.body;

      console.log(`Sending request to OpenRouter with key starting with: ${apiKey.substring(0, 15)}...`);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "Content-Type": "application/json",
          "HTTP-Referer": (process.env.APP_URL || "http://localhost:3000").replace(/[^\x20-\x7E]/g, ''),
          "X-Title": "Carousel Prompt Generator",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet", // Using Claude 3.5 Sonnet via OpenRouter
          messages: [{ role: "user", content: promptText }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Clean up markdown formatting if the model included it
      const cleanContent = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanContent);

      res.json(parsed);
    } catch (error: any) {
      console.error("Error calling OpenRouter:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
