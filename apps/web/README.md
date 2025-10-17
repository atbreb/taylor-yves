# Web Application

This is a Next.js 14 application with TypeScript, Tailwind CSS, and gRPC client support.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Turbopack** for fast development
- **gRPC** client configuration
- **ESLint** for code linting
- **Prettier** ready (configured at workspace level)

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking
- `pnpm clean` - Clean build artifacts and dependencies

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
│   ├── grpc/
│   │   └── client.ts
│   └── utils.ts
└── types/
```

## gRPC Integration

The application is pre-configured to work with gRPC services. The gRPC client configuration is located in `src/lib/grpc/client.ts`.

## Development

This app uses Turbopack for fast development. The `--turbo` flag is already included in the dev script for optimal performance.