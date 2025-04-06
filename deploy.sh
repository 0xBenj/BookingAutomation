#!/bin/bash

# Build the project with production environment
echo "Building React app for production..."
npm run build

# Install Firebase tools if not already installed
if ! command -v firebase &> /dev/null; then
    echo "Installing Firebase tools..."
    npm install -g firebase-tools
fi

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy --only hosting

echo "Deployment complete!"
