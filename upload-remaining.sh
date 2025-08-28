#!/bin/sh
# Upload remaining properties
set -e

echo "Uploading remaining properties..."

# Properties that still need upload
./scripts/upload-videos-simple.sh 250-st-john-street-loretto
./scripts/upload-videos-simple.sh 3558-2nd-st-n-minneapolis
./scripts/upload-videos-simple.sh 6043-hudson-rd-woodbury
./scripts/upload-videos-simple.sh 8409-8421-center-drive-spring-lake-park
./scripts/upload-videos-simple.sh 9220-bass-lake-rd-new-hope
./scripts/upload-videos-simple.sh 9220-james-ave-s-bloomington

echo "All properties uploaded!"