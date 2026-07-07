# Use the official Node.js runtime as parent image
FROM node:20-slim

# Set environment variables
ENV PORT=7860
ENV HOME=/app

# Install unzip utility (Debian package)
RUN apt-get update && apt-get install -y unzip && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy the zipped project contents
COPY project.zip ./

# Unzip the project files and delete the zip file
RUN unzip project.zip && rm project.zip

# Ensure the node user owns the /app directory and files
RUN chown -R node:node /app

# Switch to the existing node user (UID 1000)
USER node

# Install production dependencies
RUN npm install --omit=dev

# Expose the default Hugging Face port
EXPOSE 7860

# Start the Node.js Express server
CMD ["node", "server.js"]
