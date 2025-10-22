#!/bin/sh
# Railway start script for Vite production

# Build the app
npm run build

# Serve with vite preview
npm run preview -- --host 0.0.0.0 --port $PORT
