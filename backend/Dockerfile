FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install since package-lock.json may not exist)
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "src/server.js"]
