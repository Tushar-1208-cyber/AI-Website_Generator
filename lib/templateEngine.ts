export interface ProjectTemplate {
  id: string;
  name: string;
  category: "saas" | "portfolio" | "agency" | "ecommerce" | "blog" | "dashboard" | "startup" | "docs";
  description: string;
  filesMap: Record<string, string>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // 1. SaaS Landing Page
  {
    id: "template-saas",
    name: "SaaS Platform Starter",
    category: "saas",
    description: "Modern dark SaaS landing page with features grid, pricing table, and contact modal.",
    filesMap: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaaS Platform - Next Gen AI</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans">
  <nav class="bg-slate-900 border-b border-slate-800 py-4 px-6 flex justify-between items-center">
    <div class="font-extrabold text-xl text-blue-400">SaaSFlow</div>
    <div class="space-x-4 text-xs">
      <a href="index.html" class="text-white">Home</a>
      <a href="pricing.html" class="text-slate-400 hover:text-white">Pricing</a>
    </div>
  </nav>
  <main class="py-20 px-6 text-center max-w-4xl mx-auto space-y-6">
    <h1 class="text-5xl font-extrabold text-white">Automate Your SaaS Workflow</h1>
    <p class="text-slate-400 text-base max-w-xl mx-auto">AI-powered website generation & real-time visual editing for modern software teams.</p>
    <a href="pricing.html" class="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg">Start Free Trial</a>
  </main>
</body>
</html>`,
      "pricing.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing - SaaS Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-8">
  <div class="max-w-4xl mx-auto text-center space-y-8">
    <h1 class="text-4xl font-bold">Simple, Transparent Pricing</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 class="font-bold text-lg">Starter</h3>
        <p class="text-2xl font-extrabold my-2">$19/mo</p>
        <a href="index.html" class="block text-center py-2 bg-slate-800 rounded-xl text-xs font-bold">Choose Starter</a>
      </div>
      <div class="p-6 bg-slate-900 border-2 border-blue-500 rounded-2xl">
        <h3 class="font-bold text-lg text-blue-400">Pro SaaS</h3>
        <p class="text-2xl font-extrabold my-2">$49/mo</p>
        <a href="index.html" class="block text-center py-2 bg-blue-600 rounded-xl text-xs font-bold text-white">Choose Pro</a>
      </div>
    </div>
  </div>
</body>
</html>`,
      "style.css": `:root {
  --primary-color: #2563eb;
  --bg-color: #020617;
  --card-bg-color: #0f172a;
  --text-color: #f8fafc;
}`,
    },
  },

  // 2. Developer Portfolio
  {
    id: "template-portfolio",
    name: "Developer Portfolio",
    category: "portfolio",
    description: "Personal developer portfolio with project gallery, tech stack badges, and contact form.",
    filesMap: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex Rivera - Full Stack Developer</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-950 text-slate-100 p-8 max-w-4xl mx-auto space-y-12">
  <header class="space-y-4">
    <h1 class="text-4xl font-extrabold text-emerald-400">Alex Rivera</h1>
    <p class="text-slate-400">Senior Full-Stack Engineer building Next.js & AI Web Applications.</p>
  </header>
  <section class="space-y-4">
    <h2 class="text-2xl font-bold border-b border-slate-800 pb-2">Projects</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <h3 class="font-bold">AI Code Generator</h3>
        <p class="text-xs text-slate-400">Built with React 19 & Gemini API.</p>
      </div>
    </div>
  </section>
</body>
</html>`,
      "style.css": `:root {
  --primary-color: #10b981;
  --bg-color: #020617;
}`,
    },
  },

  // 3. Admin Dashboard
  {
    id: "template-dashboard",
    name: "Admin Analytics Dashboard",
    category: "dashboard",
    description: "Interactive admin dashboard layout with data widgets, stat cards, and user tables.",
    filesMap: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-950 text-slate-100 flex min-h-screen">
  <aside class="w-64 bg-slate-900 border-r border-slate-800 p-6 space-y-6">
    <div class="font-bold text-lg text-purple-400">AdminPanel</div>
    <nav class="space-y-2 text-xs">
      <a href="index.html" class="block px-3 py-2 bg-purple-600/20 text-purple-400 font-bold rounded-xl">Overview</a>
    </nav>
  </aside>
  <main class="flex-1 p-8 space-y-6">
    <h1 class="text-2xl font-bold">Analytics Overview</h1>
    <div class="grid grid-cols-3 gap-4">
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <span class="text-xs text-slate-500">Total Users</span>
        <p class="text-2xl font-bold">12,480</p>
      </div>
    </div>
  </main>
</body>
</html>`,
      "style.css": `:root {
  --primary-color: #a855f7;
}`,
    },
  },
];

/**
 * Get available starter templates
 */
export function getAvailableTemplates(): ProjectTemplate[] {
  return PROJECT_TEMPLATES;
}

/**
 * Apply selected starter template to project filesMap
 */
export function applyTemplateToProject(templateId: string): Record<string, string> {
  const template = PROJECT_TEMPLATES.find((t) => t.id === templateId) || PROJECT_TEMPLATES[0];
  return { ...template.filesMap };
}
