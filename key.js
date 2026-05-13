export default function handler(req, res) {
  // Returns the API key safely to the frontend
  // Key is stored in Vercel environment variables - never in code
  res.status(200).json({ 
    k: process.env.ANTHROPIC_KEY || '' 
  });
}
