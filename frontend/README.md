# Pharm Frontend

A comprehensive pharmacy scheduling and communication frontend built with [Vite](https://vitejs.dev/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/).

## 🎯 Project Purpose

This frontend application is designed for pharmacist schedulers to:
- **Manage Employee Schedules**: Import Excel data and view schedules across all stores
- **SMS Communication**: Send and receive messages with employees via Capcom6 SMS Gateway
- **AI Chatbot Integration**: Interact with intelligent assistant for scheduling queries
- **Smart Conversation Management**: Toggle between AI and direct human communication
- **Multi-Store Support**: Access scheduling data for all pharmacy locations

## 🚀 Features

- ⚡ **Vite** - Fast development and build tool
- ⚛️ **React 18** - Modern React with hooks and concurrent features
- 🔷 **TypeScript** - Type-safe development
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🎯 **shadcn/ui** - Beautiful and accessible UI components
- 🔄 **Hot Reload** - Instant development feedback
- 🐳 **Docker** - Containerized development and production
- 🔗 **Supabase Integration** - Backend API integration

## 🛠 Tech Stack

### **Frontend**
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool with hot module replacement
- **shadcn/ui** - Beautiful, accessible UI components built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Server state management with caching
- **React Router** - Client-side routing
- **React Hook Form** - Form handling with validation

### **UI Components**
- **Radix UI** - Headless UI primitives
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications
- **Recharts** - Data visualization
- **React Day Picker** - Date picker component

## 📦 Development

### **Prerequisites**
- Node.js 18+
- Docker (for containerized development)

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### **Docker Development**
```bash
# Build and start with hot reload
docker compose up frontend

# Or build the development image
docker build -f Dockerfile --target development -t pharm-frontend:dev .
```

## 🔧 Configuration

### **Environment Variables**
```env
# Supabase Configuration
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **Vite Configuration**
- **Port**: 3000 (configurable in `vite.config.ts`)
- **Host**: 0.0.0.0 (for Docker compatibility)
- **Hot Reload**: Enabled with polling for Docker
- **Aliases**: `@` points to `./src`

## 🐳 Docker

### **Development**
```dockerfile
# Uses the development target
docker build --target development -t pharm-frontend:dev .
```

### **Production**
```dockerfile
# Uses the production target with nginx
docker build --target production -t pharm-frontend:prod .
```

### **Multi-stage Build**
- **deps**: Install dependencies
- **builder**: Build the application
- **production**: Serve with nginx
- **development**: Development server with hot reload

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility libraries
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   └── App.tsx        # Main application component
├── public/            # Static assets
├── Dockerfile         # Multi-stage Docker build
├── nginx.conf         # Nginx configuration for production
├── vite.config.ts     # Vite configuration
├── tailwind.config.ts # Tailwind CSS configuration
└── package.json       # Dependencies and scripts
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 🔗 Integration

This frontend integrates with:
- **Supabase Backend** - Database, authentication, and real-time features
- **Docker Compose** - Unified development environment
- **MCP Servers** - Enhanced development with Playwright for testing

## 🚀 Deployment

### **Development**
```bash
# Start with hot reload
docker compose up frontend
```

### **Production**
```bash
# Build production image
docker build --target production -t pharm-frontend:prod .

# Run with nginx
docker run -p 80:80 pharm-frontend:prod
```

## 📚 Documentation

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://reactjs.org/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)