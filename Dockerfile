# Use the official Node.js runtime as parent image
FROM node:20-slim

# Set environment variables
ENV PORT=7860
ENV HOME=/app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=450"

# Set working directory inside the container
WORKDIR /app

# Ensure the node user owns the /app directory so it can create lockfiles/directories
RUN chown -R node:node /app

# Copy package.json and package-lock.json with correct ownership
COPY --chown=node:node package*.json ./

# Switch to the existing node user (UID 1000)
USER node

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the application files and change ownership to node user
COPY --chown=node:node . .

# Expose the default Hugging Face Spaces port
EXPOSE 7860

# Start the Node.js Express server
CMD ["node", "server.js"]
