import type { HtmlTheme } from "../schemas/htmlPageSchema.js";

export function getThemeCss(theme: HtmlTheme): string {
  const themes: Record<HtmlTheme, string> = {
    "modern-blue": `
      :root {
        --bg: #f6f7fb;
        --surface: #ffffff;
        --text: #1f2937;
        --muted: #6b7280;
        --primary: #2563eb;
        --primary-dark: #1d4ed8;
        --border: #e5e7eb;
        --shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
      }
    `,
    "minimal-gray": `
      :root {
        --bg: #f9fafb;
        --surface: #ffffff;
        --text: #111827;
        --muted: #6b7280;
        --primary: #374151;
        --primary-dark: #111827;
        --border: #e5e7eb;
        --shadow: 0 16px 32px rgba(17, 24, 39, 0.06);
      }
    `,
    "warm-orange": `
      :root {
        --bg: #fff7ed;
        --surface: #ffffff;
        --text: #292524;
        --muted: #78716c;
        --primary: #ea580c;
        --primary-dark: #c2410c;
        --border: #fed7aa;
        --shadow: 0 20px 45px rgba(154, 52, 18, 0.12);
      }
    `,
    "dark-tech": `
      :root {
        --bg: #020617;
        --surface: #0f172a;
        --text: #e5e7eb;
        --muted: #94a3b8;
        --primary: #38bdf8;
        --primary-dark: #0284c7;
        --border: #1e293b;
        --shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
      }
    `
  };

  return themes[theme] ?? themes["modern-blue"];
}

export function baseCss(theme: HtmlTheme): string {
  return `
    ${getThemeCss(theme)}

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .page {
      width: min(980px, calc(100% - 32px));
      margin: 0 auto;
      padding: 48px 0;
    }

    .section {
      margin: 32px 0;
      padding: 32px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      box-shadow: var(--shadow);
    }

    .hero {
      padding: 56px 40px;
      text-align: center;
      background:
        radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 18%, transparent), transparent 34%),
        var(--surface);
    }

    .hero h1 {
      margin: 0;
      font-size: clamp(2rem, 5vw, 4rem);
      line-height: 1.1;
      letter-spacing: -0.04em;
    }

    .hero p {
      max-width: 680px;
      margin: 20px auto 0;
      color: var(--muted);
      font-size: 1.125rem;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 28px;
      padding: 12px 20px;
      border-radius: 999px;
      background: var(--primary);
      color: white;
      font-weight: 700;
      transition: 0.2s ease;
    }

    .button:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }

    .section h2 {
      margin: 0 0 16px;
      font-size: 1.75rem;
      letter-spacing: -0.02em;
    }

    .section h3 {
      margin: 0 0 8px;
      font-size: 1.1rem;
    }

    .section p {
      margin: 0;
    }

    .muted {
      color: var(--muted);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-top: 24px;
    }

    .card {
      padding: 20px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: color-mix(in srgb, var(--surface) 92%, var(--primary) 8%);
    }

    .steps {
      counter-reset: step;
      display: grid;
      gap: 16px;
      margin-top: 24px;
    }

    .step {
      position: relative;
      padding: 20px 20px 20px 64px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: var(--surface);
    }

    .step::before {
      counter-increment: step;
      content: counter(step);
      position: absolute;
      left: 20px;
      top: 20px;
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: var(--primary);
      color: white;
      font-weight: 700;
    }

    .faq-item {
      border-top: 1px solid var(--border);
      padding: 18px 0;
    }

    .faq-item:first-of-type {
      border-top: 0;
    }

    footer {
      margin-top: 40px;
      color: var(--muted);
      text-align: center;
      font-size: 0.95rem;
    }

    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      margin-top: 12px;
    }

    .footer-links a {
      color: var(--primary);
      font-weight: 600;
    }

    @media (max-width: 760px) {
      .page {
        width: min(100% - 24px, 980px);
        padding: 24px 0;
      }

      .section {
        padding: 24px;
        border-radius: 20px;
      }

      .hero {
        padding: 40px 24px;
      }

      .grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}
