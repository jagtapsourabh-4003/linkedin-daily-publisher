# Use the official Node.js runtime as parent image
FROM node:20-slim

# Set environment variables
ENV PORT=7860
ENV HOME=/app

# Create a non-root user and group with UID 1000 (standard for Hugging Face)
RUN useradd -m -u 1000 user

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first, and change ownership to user
COPY --chown=user:user package*.json ./

# Switch to the non-root user
USER user

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application files and change ownership to user
COPY --chown=user:user . .

# Expose the default Hugging Face Spaces port
EXPOSE 7860

# Start the Node.js Express server
CMD ["node", "server.js"]
