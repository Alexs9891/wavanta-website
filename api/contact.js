const CONTACT_TO_EMAIL = "hello@wavanta.ai";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderPage(title, message, status = 200) {
  return {
    status,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | Wavanta</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        color: #fff;
        background: linear-gradient(105deg, #09224a, #102a66 42%, #0b143d);
        font-family: Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        max-width: 620px;
        padding: 32px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
      }
      h1 {
        margin: 0 0 12px;
        font-family: Sora, Manrope, system-ui, sans-serif;
        line-height: 1.08;
      }
      p {
        margin: 0 0 22px;
        color: rgba(255, 255, 255, 0.78);
        line-height: 1.6;
      }
      a {
        color: #fff;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <a href="/#contact">Return to Wavanta</a>
    </main>
  </body>
</html>`,
  };
}

async function readBody(req) {
  if (typeof req.body === "string") return req.body;
  if (req.body && typeof req.body === "object") {
    return new URLSearchParams(req.body).toString();
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(
    chunks.map((chunk) => (Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))),
  ).toString("utf8");
}

function buildEmailHtml(fields) {
  return `
    <h2>New Wavanta enquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(fields.fullName)}</p>
    <p><strong>Company:</strong> ${escapeHtml(fields.companyName || "Not provided")}</p>
    <p><strong>Email:</strong> ${escapeHtml(fields.email)}</p>
    <p><strong>Interest:</strong> ${escapeHtml(fields.interest || "Not provided")}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(fields.message || "Not provided").replaceAll("\n", "<br />")}</p>
  `;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    const page = renderPage("Contact form", "Please submit the form from the contact section.", 405);
    res.setHeader("Allow", "POST");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(page.status).send(page.html);
    return;
  }

  const params = new URLSearchParams(await readBody(req));
  const fields = {
    fullName: params.get("fullName")?.trim(),
    companyName: params.get("companyName")?.trim(),
    email: params.get("email")?.trim(),
    interest: params.get("interest")?.trim(),
    message: params.get("message")?.trim(),
  };

  if (!fields.fullName || !fields.email) {
    const page = renderPage("Missing details", "Please provide your name and work email before submitting.", 400);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(page.status).send(page.html);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  // TODO: Add RESEND_API_KEY and CONTACT_FROM_EMAIL in Vercel project settings.
  if (!apiKey || !fromEmail) {
    const page = renderPage(
      "Form setup needed",
      "Thanks for your interest. The secure form endpoint is in place, but email delivery still needs to be connected. Please contact hello@wavanta.ai directly for now.",
      503,
    );
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(page.status).send(page.html);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: CONTACT_TO_EMAIL,
      reply_to: fields.email,
      subject: `New Wavanta enquiry from ${fields.fullName}`,
      html: buildEmailHtml(fields),
    }),
  });

  if (!response.ok) {
    const page = renderPage(
      "Something went wrong",
      "Your enquiry could not be sent just now. Please email hello@wavanta.ai and we’ll come back to you.",
      502,
    );
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(page.status).send(page.html);
    return;
  }

  const page = renderPage(
    "Thanks, we’ve got your enquiry",
    "We’ll review your message and come back to you with a sensible next step.",
  );
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(page.status).send(page.html);
};
