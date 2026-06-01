FROM node:20-slim

# Install system dependencies for Puppeteer (Chromium)
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates curl \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN npm install -g bun

# Set working directory
WORKDIR /app

# Copy package and lock file
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy all source files
COPY . .

# Build the app
RUN bun run build

# Hugging Face Spaces expose port 7860 by default
EXPOSE 7860
ENV PORT=7860
ENV HOST=0.0.0.0

# Start the application
CMD ["bun", "run", "start"]
