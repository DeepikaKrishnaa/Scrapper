import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://mail-scrapper-lyart.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

let savedTokens = null;

app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
  });

  res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  savedTokens = tokens;

  res.redirect("https://mail-scrapper-lyart.vercel.app");
});

app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!savedTokens) {
      return res.status(401).send("Not authenticated");
    }

    oauth2Client.setCredentials(savedTokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 10,
    });

    const messages = response.data.messages || [];

    const emailData = await Promise.all(
      messages.map(async (msg) => {
        const email = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });

        const headers = email.data.payload.headers;

        const subject = headers.find(h => h.name === "Subject")?.value;
        const from = headers.find(h => h.name === "From")?.value;

        return {
          id: msg.id,
          subject,
          from,
          snippet: email.data.snippet,
        };
      })
    );

    res.json(emailData);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching emails");
  }
});

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});