# Use the official Node.js runtime as parent image
FROM node:20-slim

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose port (Hugging Face Spaces runs on port 7860 by default)
EXPOSE 7860
ENV PORT=7860

# Start the Node.js Express server
CMD ["node", "server.js"]
