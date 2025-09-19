#!/bin/bash

# 🔧 CLEAN PACKAGE FIX SCRIPT - NO LEGACY PEER DEPS

echo "🚀 Fixing frontend package dependencies..."

cd frontend

# 1. Remove conflicting files
echo "🧹 Cleaning existing installation..."
rm -rf node_modules
rm -f package-lock.json

# 2. Create clean package.json with compatible versions
echo "📝 Creating clean package.json..."

cat > package.json << 'EOF'
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.2",
    "@tensorflow/tfjs": "^4.15.0",
    "@tensorflow-models/coco-ssd": "^2.2.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}
EOF

# 3. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 4. Add socket.io types separately
echo "🔌 Adding socket.io types..."
npm install -D @types/node

# 5. Verify installation
echo "✅ Verifying installation..."

# Check if key packages are installed
if npm list socket.io-client > /dev/null 2>&1; then
    echo "✅ socket.io-client: OK"
else
    echo "❌ socket.io-client: FAILED"
fi

if npm list @tensorflow/tfjs > /dev/null 2>&1; then
    echo "✅ tensorflow.js: OK"
else
    echo "❌ tensorflow.js: FAILED"
fi

if npm list axios > /dev/null 2>&1; then
    echo "✅ axios: OK"
else
    echo "❌ axios: FAILED"
fi

# 6. Create proper TypeScript config
echo "⚙️ Setting up TypeScript config..."

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
EOF

# 7. Update vite config
echo "⚙️ Updating Vite config..."

cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      '@tensorflow/tfjs', 
      '@tensorflow-models/coco-ssd',
      'socket.io-client'
    ]
  }
})
EOF

# 8. Create environment file
echo "🔧 Creating environment file..."

cat > .env << 'EOF'
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
EOF

# 9. Final verification
echo ""
echo "🔍 FINAL VERIFICATION:"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

# Test imports
echo "🧪 Testing imports..."
node -e "
const test = async () => {
  try {
    const io = await import('socket.io-client');
    console.log('✅ socket.io-client import: OK');
  } catch(e) {
    console.log('❌ socket.io-client import: FAILED', e.message);
  }
  
  try {
    const axios = await import('axios');
    console.log('✅ axios import: OK');
  } catch(e) {
    console.log('❌ axios import: FAILED', e.message);
  }
};
test();
"

echo ""
echo "🎉 PACKAGE FIX COMPLETE!"
echo ""
echo "🚀 Ready to start development:"
echo "   npm run dev"
echo ""
echo "📁 Files updated:"
echo "   ✅ package.json (clean dependencies)"
echo "   ✅ tsconfig.json (proper TypeScript config)"
echo "   ✅ vite.config.ts (optimized for our stack)"
echo "   ✅ .env (environment variables)"
echo ""

# Optional: Start dev server
read -p "🚀 Start development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Starting development server..."
    npm run dev
fi