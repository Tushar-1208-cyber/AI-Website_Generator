# AI Website Generator 🚀

A powerful, AI-driven website generator that creates beautiful, responsive websites from natural language descriptions. Built with Next.js, Tailwind CSS, and Google's Gemini AI.

## ✨ Features

- **🤖 AI-Powered Generation**: Generate complete websites using Google Gemini AI from simple text descriptions
- **🎨 Modern UI Components**: Pre-built components using Flowbite UI, Tailwind CSS, and Radix UI
- **💬 Real-time Chat Interface**: Interactive chat to refine and customize your designs
- **📱 Fully Responsive**: All generated websites are mobile-first and responsive
- **🎯 Multiple Design Templates**: Quick-start templates for dashboards, forms, hero sections, and more
- **🔐 User Authentication**: Secure authentication powered by Clerk
- **💾 Project Management**: Save and manage multiple projects
- **🔄 Real-time Preview**: See your changes instantly in the playground
- **📊 Data Persistence**: Store projects, frames, and chat history using Drizzle ORM and Neon Database
- **🎨 Theme Support**: Dark/light mode support with modern theming
- **📤 Export Ready**: Export generated code to your projects

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library
- **Recharts** - Chart library
- **Sonner** - Toast notifications

### Backend & Database
- **Drizzle ORM** - Type-safe ORM
- **Neon Database** - Serverless PostgreSQL
- **Next.js API Routes** - Serverless API endpoints

### AI & Authentication
- **Google Gemini AI** - AI model for content generation
- **Clerk** - Authentication and user management

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Drizzle Kit** - Database migrations and studio

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun
- A Neon Database account
- A Clerk account for authentication
- A Google AI Studio account (for Gemini API key)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/krishrathi1/Ai--Website-Generator-.git
cd ai-website-generator
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=your_neon_database_url

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI Model (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Next.js
NEXT_PUBLIC_URL=http://localhost:3000
```

4. **Set up the database**
```bash
# Push the database schema
npm run db:push

# Optional: Open Drizzle Studio to view your database
npm run db:studio
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push database schema changes |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:generate` | Generate migrations |
| `npm run db:cleanup` | Clean up database |

## 🏗️ Project Structure

```
ai-website-generator/
├── app/                        # Next.js App Router
│   ├── _components/           # Reusable UI components
│   ├── (auth)/               # Authentication pages
│   ├── api/                  # API routes
│   │   ├── ai-model/        # AI generation endpoint
│   │   ├── project/         # Project management
│   │   ├── chats/           # Chat history
│   │   ├── users/           # User operations
│   │   └── frame/           # Frame management
│   ├── playground/          # Main playground interface
│   │   ├── _components/     # Playground components
│   │   └── [projectId]/     # Dynamic project pages
│   ├── workspace/           # User workspace
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/               # Shared UI components
│   └── ui/                  # Radix UI components
├── config/                   # Configuration files
│   ├── db.ts                # Database configuration
│   └── schema.ts            # Database schema
├── context/                  # React contexts
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions
├── public/                   # Static assets
├── scripts/                  # Utility scripts
├── types/                    # TypeScript types
├── middleware.ts             # Next.js middleware
├── drizzle.config.ts         # Drizzle configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── README.md                 # This file
```

## 🔑 Key Features Explained

### AI-Powered Generation

The platform uses Google's Gemini AI to generate complete, production-ready HTML/CSS/JS code based on your descriptions. The AI is configured to:

- Use Tailwind CSS and Flowbite UI components
- Create responsive, mobile-first designs
- Use a blue color theme
- Include proper spacing, alignment, and visual hierarchy
- Add interactive components (modals, dropdowns, accordions)
- Include Chart.js for data visualization
- Use placeholders for images

### Playground Interface

The playground provides:
- **Chat Section**: Interact with the AI to refine designs
- **Live Preview**: See your website in real-time
- **Settings Panel**: Configure generation parameters
- **Code Export**: Copy generated code

### Project Management

Each project consists of:
- **Projects**: Container for your website
- **Frames**: Different versions/iterations of your design
- **Chat Messages**: Conversation history for each frame
- **Design Code**: The generated HTML/CSS/JS code

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Headless UI components
- [Google Gemini AI](https://ai.google.dev/) - AI model
- [Clerk](https://clerk.com/) - Authentication
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe ORM
- [Neon](https://neon.tech/) - Serverless Postgres

## 📧 Support

For support, krishrathi877@gmail.com or open an issue in the repository.

---

**Built with ❤️ using Next.js and AI**
