FROM node:20-bullseye-slim

WORKDIR /app

# Install openssl for Prisma engine support
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Default build arguments to prevent Next.js static evaluation failures during build
ARG DATABASE_URL="mongodb+srv://satyam:satyam@backend.vlkhhhz.mongodb.net/nova?retryWrites=true&w=majority&appName=Backend"
ENV DATABASE_URL=$DATABASE_URL
ARG JWT_SECRET="nova-production-deployment-secret-key-2026"
ENV JWT_SECRET=$JWT_SECRET
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js
RUN npm run build

# Default runtime environment
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Start unified Next.js + Socket.io server
CMD ["node", "server.js"]
