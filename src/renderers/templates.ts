import type { HtmlTheme } from "../schemas/htmlPageSchema.js";

export function getThemeCss(theme: HtmlTheme): string {
  const themes: Record<HtmlTheme, string> = {
    "modern-blue": `
      :root {
        --bg: #f5f7fb;
        --bg-glow: rgba(36, 107, 254, 0.16);
        --surface: #ffffff;
        --surface-alt: #f8fbff;
        --surface-raised: #ffffff;
        --text: #172033;
        --muted: #64748b;
        --primary: #246bfe;
        --primary-dark: #174ea6;
        --primary-soft: #eaf1ff;
        --accent: #f59e0b;
        --accent-soft: #fff6df;
        --border: #dbe5f0;
        --border-strong: #b8c7da;
        --soft: #eef4ff;
        --shadow: 0 24px 70px rgba(15, 23, 42, 0.13);
        --soft-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
        --overlay: rgba(255, 255, 255, 0.8);
      }
    `,
    "minimal-gray": `
      :root {
        --bg: #f6f7f9;
        --bg-glow: rgba(55, 65, 81, 0.10);
        --surface: #ffffff;
        --surface-alt: #f3f4f6;
        --surface-raised: #ffffff;
        --text: #111827;
        --muted: #6b7280;
        --primary: #374151;
        --primary-dark: #111827;
        --primary-soft: #eceff3;
        --accent: #b45309;
        --accent-soft: #fffbeb;
        --border: #e1e5ea;
        --border-strong: #c8ced8;
        --soft: #f3f4f6;
        --shadow: 0 22px 58px rgba(17, 24, 39, 0.09);
        --soft-shadow: 0 10px 26px rgba(17, 24, 39, 0.06);
        --overlay: rgba(255, 255, 255, 0.84);
      }
    `,
    "warm-orange": `
      :root {
        --bg: #fff7ed;
        --bg-glow: rgba(234, 88, 12, 0.16);
        --surface: #ffffff;
        --surface-alt: #fffaf5;
        --surface-raised: #ffffff;
        --text: #292524;
        --muted: #78716c;
        --primary: #ea580c;
        --primary-dark: #c2410c;
        --primary-soft: #ffedd5;
        --accent: #0f766e;
        --accent-soft: #ccfbf1;
        --border: #fed7aa;
        --border-strong: #fdba74;
        --soft: #ffedd5;
        --shadow: 0 24px 62px rgba(154, 52, 18, 0.14);
        --soft-shadow: 0 12px 28px rgba(154, 52, 18, 0.10);
        --overlay: rgba(255, 255, 255, 0.82);
      }
    `,
    "dark-tech": `
      :root {
        --bg: #020617;
        --bg-glow: rgba(56, 189, 248, 0.18);
        --surface: #0f172a;
        --surface-alt: #111c31;
        --surface-raised: #14213a;
        --text: #e5e7eb;
        --muted: #9aa8bd;
        --primary: #38bdf8;
        --primary-dark: #7dd3fc;
        --primary-soft: #082f49;
        --accent: #fbbf24;
        --accent-soft: #3b2607;
        --border: #203047;
        --border-strong: #334155;
        --soft: #082f49;
        --shadow: 0 26px 70px rgba(0, 0, 0, 0.42);
        --soft-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
        --overlay: rgba(15, 23, 42, 0.82);
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
      text-indent: 0 !important;
    }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 12% 0%, var(--bg-glow), transparent 30%),
        radial-gradient(circle at 92% 8%, var(--accent-soft), transparent 24%),
        var(--bg);
      color: var(--text);
      line-height: 1.62;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .page {
      width: min(1040px, calc(100% - 32px));
      margin: 0 auto;
      padding: 32px 0 40px;
    }

    .section {
      margin: 18px 0 0;
      padding: 24px;
      background: linear-gradient(180deg, var(--surface), var(--surface-alt));
      border: 1px solid var(--border);
      border-radius: 22px;
      box-shadow: var(--soft-shadow);
      overflow: hidden;
    }

    .hero {
      position: relative;
      padding: 38px;
      background:
        radial-gradient(circle at 0% 0%, var(--bg-glow), transparent 34%),
        linear-gradient(135deg, var(--surface), var(--soft) 58%, var(--accent-soft));
      border-color: var(--border-strong);
      border-radius: 28px;
      box-shadow: var(--shadow);
    }

    .hero::before {
      content: "HTML Render MCP";
      display: inline-flex;
      align-items: center;
      width: fit-content;
      margin-bottom: 22px;
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--primary-soft);
      color: var(--primary-dark);
      font-size: 0.78rem;
      font-weight: 850;
      letter-spacing: 0.02em;
    }

    .hero h1 {
      margin: 0;
      max-width: 840px;
      font-size: clamp(2rem, 5vw, 3.9rem);
      line-height: 1.03;
      letter-spacing: -0.05em;
      font-weight: 950;
    }

    .hero p {
      max-width: 760px;
      margin: 16px 0 0;
      color: var(--muted);
      font-size: 1.05rem;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 24px;
      padding: 12px 18px;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      box-shadow: 0 12px 26px var(--bg-glow);
      color: white;
      font-size: 0.95rem;
      font-weight: 850;
      transition: 0.2s ease;
    }

    .button:hover {
      transform: translateY(-1px);
    }

    .section h2 {
      margin: 0 0 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
      font-size: clamp(1.25rem, 2.4vw, 1.75rem);
      line-height: 1.18;
      letter-spacing: -0.02em;
      font-weight: 900;
    }

    .section h3 {
      margin: 0 0 8px;
      font-size: 1rem;
      line-height: 1.34;
      letter-spacing: -0.01em;
      font-weight: 850;
    }

    .section p {
      margin: 0;
      text-indent: 0;
    }

    .muted {
      color: var(--muted);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 12px;
      margin-top: 18px;
    }

    .card {
      position: relative;
      padding: 18px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: var(--surface-raised);
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
    }

    .card::before {
      content: "";
      display: block;
      width: 34px;
      height: 4px;
      margin-bottom: 14px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--primary), var(--accent));
    }

    .steps {
      counter-reset: step;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 18px;
    }

    .step {
      position: relative;
      padding: 58px 18px 18px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: var(--surface-raised);
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
    }

    .step::after {
      content: "STEP";
      position: absolute;
      top: 22px;
      left: 18px;
      color: var(--primary-dark);
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0.08em;
    }

    .step::before {
      counter-increment: step;
      content: counter(step);
      position: absolute;
      right: 18px;
      top: 18px;
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 13px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      font-size: 0.86rem;
      font-weight: 950;
    }

    .faq-item {
      position: relative;
      margin-top: 10px;
      padding: 16px 16px 16px 58px;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--surface-raised);
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
    }

    .faq-item::before {
      content: "Q";
      position: absolute;
      top: 16px;
      left: 16px;
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--primary-soft);
      color: var(--primary-dark);
      font-size: 0.82rem;
      font-weight: 950;
    }

    footer {
      margin-top: 20px;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: var(--overlay);
      color: var(--muted);
      text-align: center;
      font-size: 0.93rem;
    }

    footer p {
      margin: 0;
    }

    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      margin-top: 12px;
    }

    .footer-links a {
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--primary-soft);
      color: var(--primary-dark);
      font-size: 0.88rem;
      font-weight: 750;
    }

    @media (max-width: 760px) {
      .page {
        width: min(100% - 24px, 1040px);
        padding: 24px 0;
      }

      .section {
        padding: 20px;
        border-radius: 20px;
      }

      .hero {
        padding: 28px 22px;
      }
    }
  `;
}
