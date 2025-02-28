#!/bin/bash

# Test Docker container script
# This script builds and starts a Docker container to check for startup errors

set -e

echo "🔨 Building gatekeeper Docker image for testing..."
docker build -t deplayer-gatekeeper-test -f ../gatekeeper/Dockerfile ../gatekeeper

echo "🧪 Starting container to check for import errors..."
docker run --rm -it \
  -e PORT=8080 \
  -e RP_ID=localhost \
  -e ORIGIN=http://localhost:5173 \
  -e JWT_SECRET=test-secret \
  -e ELECTRIC_URL=http://localhost:5133 \
  -e ELECTRIC_SIGNING_KEY=dummy-key \
  -e SUPABASE_URL=https://example.supabase.co \
  -e SUPABASE_KEY=dummy-key \
  deplayer-gatekeeper-test node -e "
    console.log('✅ Testing server imports...');
    import('./dist/middleware/auth.js')
      .then(() => console.log('✅ auth.js imported successfully'))
      .catch(err => { 
        console.error('❌ Error importing auth.js:', err); 
        process.exit(1);
      });
  "

echo "✅ Container test completed successfully!" 