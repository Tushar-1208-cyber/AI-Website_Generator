import JSZip from "jszip";
import { ProjectFilesMap } from "@/types/types";

export type ExportFramework = "nextjs" | "react-vite" | "vanilla";

/**
 * Converts standard HTML code string into valid React TSX JSX code.
 */
export function htmlToJsx(html: string): string {
  if (!html) return "";

  let jsx = html;
  // Replace class= with className=
  jsx = jsx.replace(/\bclass=/g, "className=");
  // Replace for= with htmlFor=
  jsx = jsx.replace(/\bfor=/g, "htmlFor=");
  // Replace tabindex= with tabIndex=
  jsx = jsx.replace(/\btabindex=/g, "tabIndex=");
  // Replace autoplay with autoPlay
  jsx = jsx.replace(/\bautoplay\b/g, "autoPlay");
  // Replace onclick= with onClick=
  jsx = jsx.replace(/\bonclick=/g, "onClick=");
  // Replace onchange= with onChange=
  jsx = jsx.replace(/\bonchange=/g, "onChange=");

  // Fix unclosed void tags: img, input, br, hr, meta, link
  jsx = jsx.replace(/<(img|input|br|hr|meta|link)([^>]*?)(?<!\/)>/gi, "<$1$2 />");

  return jsx;
}

/**
 * Generates a Next.js 14 App Router project ZIP archive.
 */
export async function generateNextJsZip(filesMap: ProjectFilesMap, projectName = "nextjs-app"): Promise<Blob> {
  const zip = new JSZip();
  const cleanName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const indexHtml = filesMap["index.html"] || filesMap["index.htm"] || "";
  const bodyContentMatch = indexHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const rawBodyContent = bodyContentMatch ? bodyContentMatch[1] : indexHtml;
  const jsxContent = htmlToJsx(rawBodyContent);

  // app/layout.tsx
  const layoutCode = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${projectName}',
  description: 'Generated with AI Website Generator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
`;

  // app/page.tsx
  const pageCode = `'use client';
import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen">
      ${jsxContent}
    </main>
  );
}
`;

  // app/globals.css
  const customCss = Object.keys(filesMap)
    .filter((k) => k.endsWith(".css"))
    .map((k) => filesMap[k])
    .join("\n\n");

  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

${customCss}
`;

  // package.json
  const packageJson = {
    name: cleanName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
    },
    dependencies: {
      next: "^14.2.0",
      react: "^18.3.0",
      "react-dom": "^18.3.0",
      "lucide-react": "^0.378.0",
    },
    devDependencies: {
      autoprefixer: "^10.4.19",
      postcss: "^8.4.38",
      tailwindcss: "^3.4.3",
      typescript: "^5.4.5",
      "@types/node": "^20.12.0",
      "@types/react": "^18.3.0",
    },
  };

  zip.file("app/layout.tsx", layoutCode);
  zip.file("app/page.tsx", pageCode);
  zip.file("app/globals.css", globalsCss);
  zip.file("package.json", JSON.stringify(packageJson, null, 2));
  zip.file("README.md", `# ${projectName}\n\nGenerated with AI Website Generator (Next.js 14 App Router).\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`);

  return await zip.generateAsync({ type: "blob" });
}

/**
 * Generates a React + Vite project ZIP archive.
 */
export async function generateReactViteZip(filesMap: ProjectFilesMap, projectName = "react-vite-app"): Promise<Blob> {
  const zip = new JSZip();
  const cleanName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const indexHtml = filesMap["index.html"] || "";
  const bodyContentMatch = indexHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const jsxContent = htmlToJsx(bodyContentMatch ? bodyContentMatch[1] : indexHtml);

  const appJsx = `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen">
      ${jsxContent}
    </div>
  );
}
`;

  const packageJson = {
    name: cleanName,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    },
    dependencies: {
      react: "^18.3.0",
      "react-dom": "^18.3.0",
      "lucide-react": "^0.378.0",
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.2.1",
      vite: "^5.2.0",
      tailwindcss: "^3.4.3",
      autoprefixer: "^10.4.19",
      postcss: "^8.4.38",
    },
  };

  zip.file("src/App.jsx", appJsx);
  zip.file("src/main.jsx", `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);\n`);
  zip.file("src/index.css", `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`);
  zip.file("index.html", `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${projectName}</title><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`);
  zip.file("package.json", JSON.stringify(packageJson, null, 2));

  return await zip.generateAsync({ type: "blob" });
}

/**
 * Generates classic Vanilla HTML/CSS/JS ZIP archive.
 */
export async function generateVanillaZip(filesMap: ProjectFilesMap): Promise<Blob> {
  const zip = new JSZip();
  Object.keys(filesMap).forEach((filePath) => {
    zip.file(filePath, filesMap[filePath]);
  });
  if (!filesMap["package.json"]) {
    zip.file(
      "package.json",
      JSON.stringify(
        {
          name: "ai-exported-website",
          version: "1.0.0",
          private: true,
          scripts: { start: "npx serve ." },
        },
        null,
        2
      )
    );
  }
  return await zip.generateAsync({ type: "blob" });
}
