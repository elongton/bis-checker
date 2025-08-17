#!/bin/bash

# Abort on error
set -e

# Set variables
DEPLOY_DIR=deploy
FRONTEND_DIST=dist
API_SRC=api

# Clean up old deploy folder
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/dist
mkdir -p $DEPLOY_DIR/api

echo "✔️ Building Angular frontend..."
npm run build -- --configuration production

echo "📦 Copying frontend build to $DEPLOY_DIR/dist"
cp -r $FRONTEND_DIST/* $DEPLOY_DIR/dist/

echo "📦 Copying API to $DEPLOY_DIR/api"
cp -r $API_SRC/* $DEPLOY_DIR/api/

echo "📦 Copying API node_modules"
cd $API_SRC
# npm install --omit=dev
cp -r node_modules ../$DEPLOY_DIR/api/node_modules
cd ..

echo "📄 Copying .env file if present"
if [ -f .env ]; then
  cp .env $DEPLOY_DIR/api
fi

echo "✅ Deploy package ready in ./$DEPLOY_DIR"
