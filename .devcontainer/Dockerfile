# Example base image (Node.js + dev tools)
FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH (Bun installs to ~/.bun by default)
ENV PATH="/root/.bun/bin:${PATH}"