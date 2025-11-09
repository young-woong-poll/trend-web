# Trend Web

Next.js project with TypeScript, SCSS, ESLint, and Prettier.

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: SCSS (Sass)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Linting

```bash
# Check for linting errors
pnpm lint

# Auto-fix linting errors
pnpm lint:fix
```

### Formatting

```bash
# Check formatting
pnpm format:check

# Format code
pnpm format
```

### Type Checking

```bash
pnpm type-check
```

## Project Structure

```
trend-web/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── styles/          # Global styles and SCSS modules
│   ├── types/           # TypeScript type definitions
│   └── constants/       # Application constants
├── public/              # Static files
├── .eslintrc.json       # ESLint configuration
├── .prettierrc          # Prettier configuration
├── next.config.ts       # Next.js configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Sass Documentation](https://sass-lang.com/documentation)
