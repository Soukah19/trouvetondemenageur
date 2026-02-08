#!/bin/bash

echo "========================================"
echo "  TrouveTonDemenageur - Clean Start"
echo "========================================"
echo ""

echo "[1/5] Cleaning old files..."
if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    echo "   - Cleared Vite cache"
fi
if [ -d "dist" ]; then
    rm -rf dist
    echo "   - Cleared dist folder"
fi
echo "   ✓ Cleanup complete"
echo ""

echo "[2/5] Checking Node.js version..."
node --version
echo ""

echo "[3/5] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "   ✗ Installation failed!"
    exit 1
fi
echo "   ✓ Dependencies installed"
echo ""

echo "[4/5] Starting development server..."
echo ""
echo "========================================"
echo "  Server starting on http://localhost:5173"
echo "  Press Ctrl+C to stop"
echo "========================================"
echo ""

npm run dev
