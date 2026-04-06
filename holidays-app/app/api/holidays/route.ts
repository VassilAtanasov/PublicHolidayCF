export const runtime = "edge";

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";

export async function POST(request: Request) {
  const { date } = await request.json();

  const formattedDate = new Date(date + "T12:00:00Z").toLocaleDateString(
    "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }
  );

  const prompt = `Return a plain-text list (no other Markdown). List national public holidays (off work) on ${formattedDate} worldwide. Always put United States holidays first (if any). Verify it is a non-working day in the country. Group by holiday name with countries in parentheses, ordered by popularity. No explanations.`;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a precise world holiday reference. Return only what is asked. No markdown, no extra commentary.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch from Cloudflare Workers AI" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const result = data?.result?.response ?? "No results returned.";

    return Response.json({ result });
  } catch {
    return Response.json(
      { error: "Failed to fetch from Cloudflare Workers AI" },
      { status: 500 }
    );
  }
}
