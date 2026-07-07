# Use the official Node.js runtime as parent image
FROM node:20-slim

# Set environment variables
ENV PORT=7860
ENV HOME=/app

# Set working directory inside the container
WORKDIR /app

# Copy all application files (run as root to ensure all files are copied first)
COPY . .

# Change ownership of the entire /app folder to the node user (UID 1000)
RUN chown -R node:node /app

# Switch to the existing node user (UID 1000)
USER node

# Install production dependencies
RUN npm install --omit=dev

# Expose the default Hugging Face Spaces port
EXPOSE 7860

# Start the Node.js Express server
CMD ["node", "server.js"]
