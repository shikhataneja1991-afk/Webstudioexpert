export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, industry } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const prompt = `You are an expert AI website auditor. Analyse "${url}" for a ${industry || 'general business'}.
Return ONLY raw JSON, no markdown, no backticks, nothing else:
{"overallScore":72,"scoreTitle":"Needs improvement","scoreSummary":"Two sentences specific to this site.","categories":{"seo":65,"speed":70,"mobile":80,"trust":55,"copy":60,"conversion":50},"issues":[{"title":"Issue","description":"One sentence.","priority":"high"},{"title":"Issue","description":"One sentence.","priority":"high"},{"title":"Issue","description":"One sentence.","priority":"med"},{"title":"Issue","description":"One sentence.","priority":"med"},{"title":"Issue","description":"One sentence.","priority":"low"}],"fixes":[{"issue":"Name","fix":"Specific actionable fix"},{"issue":"Name","fix":"Specific actionable fix"},{"issue":"Name","fix":"Specific actionable fix"}],"actionPlan":[{"focus":"Theme","tasks":["task","task","task"]},{"focus":"Theme","tasks":["task","task","task"]},{"focus":"Theme","tasks":["task","task","task"]},{"focus":"Theme","tasks":["task","task","task"]}]}
Tailor everything specifically to "${url}" and the ${industry} industry. Vary scores realistically.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: error.error?.message || 'API error' });
    }

    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');

    if (start === -1 || end === -1) {
      return res.status(500).json({ error: 'Could not parse AI response' });
    }

    const audit = JSON.parse(raw.slice(start, end + 1));
    return res.status(200).json(audit);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
