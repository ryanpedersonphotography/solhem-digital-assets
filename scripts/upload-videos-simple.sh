#!/bin/sh

# Simple Video Upload Script using Netlify CLI
# Works with older bash versions

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VIDEO_SOURCE_DIR="/Users/ryanpederson/Dev/Video Files"
PROPERTY_ID="$1"

echo "${BLUE}🎥 Video Upload via Netlify CLI${NC}"
echo "${BLUE}================================${NC}"

# Check if netlify CLI is installed
if ! command -v netlify >/dev/null 2>&1; then
    echo "${RED}❌ Netlify CLI is not installed${NC}"
    echo "${YELLOW}Install with: npm install -g netlify-cli${NC}"
    exit 1
fi

if [ -z "$PROPERTY_ID" ]; then
    echo "${YELLOW}Usage: $0 <property-id>${NC}"
    echo "${YELLOW}Example: $0 5624-lincoln-drive-edina${NC}"
    exit 1
fi

# Map property ID to folder name
case "$PROPERTY_ID" in
    "5624-lincoln-drive-edina")
        FOLDER_NAME="5624 Lincoln Drive Edina"
        ;;
    "10740-lyndale-ave-s-bloomington")
        FOLDER_NAME="10740 Lyndale Bloomington"
        ;;
    "10800-lyndale-ave-s-bloomington")
        FOLDER_NAME="10800 Lyndale Bloomington"
        ;;
    "250-st-john-street-loretto")
        FOLDER_NAME="250 St John Street Loretto"
        ;;
    "3558-2nd-st-n-minneapolis")
        FOLDER_NAME="3558 2nd St N Minneapolis"
        ;;
    "6043-hudson-rd-woodbury")
        FOLDER_NAME="6043 6053 6063 Hudson Rd Woodbury"
        ;;
    "7825-washington-ave-bloomington")
        FOLDER_NAME="7825 Washington Ave"
        ;;
    "8409-8421-center-drive-spring-lake-park")
        FOLDER_NAME="8409-8421 Center Drive Spring Lake Park"
        ;;
    "9220-bass-lake-rd-new-hope")
        FOLDER_NAME="9220 Bass Lake Rd New Hope"
        ;;
    "9220-james-ave-s-bloomington")
        FOLDER_NAME="9220 James Ave S Bloomington"
        ;;
    *)
        echo "${RED}❌ Unknown property ID: $PROPERTY_ID${NC}"
        exit 1
        ;;
esac

PROPERTY_PATH="$VIDEO_SOURCE_DIR/$FOLDER_NAME"

if [ ! -d "$PROPERTY_PATH" ]; then
    echo "${RED}❌ Property folder not found: $PROPERTY_PATH${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}📁 Processing $FOLDER_NAME...${NC}"

# Upload Drone videos
for drone_dir in "Drone_Videos" "Drone"; do
    DRONE_PATH="$PROPERTY_PATH/$drone_dir"
    if [ -d "$DRONE_PATH" ]; then
        echo "${BLUE}  🚁 Uploading drone videos from $drone_dir...${NC}"
        for video in "$DRONE_PATH"/*.MP4 "$DRONE_PATH"/*.mp4 "$DRONE_PATH"/*.MOV "$DRONE_PATH"/*.mov; do
            if [ -f "$video" ]; then
                filename=$(basename "$video")
                size_mb=$(du -m "$video" | cut -f1)
                
                if [ "$size_mb" -gt 5120 ]; then
                    echo "${YELLOW}  ⚠️  Skipping $filename (${size_mb}MB - exceeds 5GB)${NC}"
                    continue
                fi
                
                echo "${BLUE}  📤 Uploading $filename (${size_mb}MB)...${NC}"
                
                if netlify blobs:set property-videos "$PROPERTY_ID/drone/$filename" "$video"; then
                    echo "${GREEN}  ✅ Uploaded successfully!${NC}"
                else
                    echo "${RED}  ❌ Failed to upload $filename${NC}"
                fi
            fi
        done
        break
    fi
done

# Upload Property videos
for prop_dir in "Property_Videos" "Property Videos" "Property"; do
    PROP_PATH="$PROPERTY_PATH/$prop_dir"
    if [ -d "$PROP_PATH" ]; then
        echo "${BLUE}  🏢 Uploading property videos from $prop_dir...${NC}"
        for video in "$PROP_PATH"/*.MP4 "$PROP_PATH"/*.mp4 "$PROP_PATH"/*.MOV "$PROP_PATH"/*.mov; do
            if [ -f "$video" ]; then
                filename=$(basename "$video")
                size_mb=$(du -m "$video" | cut -f1)
                
                if [ "$size_mb" -gt 5120 ]; then
                    echo "${YELLOW}  ⚠️  Skipping $filename (${size_mb}MB - exceeds 5GB)${NC}"
                    continue
                fi
                
                echo "${BLUE}  📤 Uploading $filename (${size_mb}MB)...${NC}"
                
                if netlify blobs:set property-videos "$PROPERTY_ID/property/$filename" "$video"; then
                    echo "${GREEN}  ✅ Uploaded successfully!${NC}"
                else
                    echo "${RED}  ❌ Failed to upload $filename${NC}"
                fi
            fi
        done
        break
    fi
done

echo ""
echo "${GREEN}✅ Upload process complete!${NC}"
echo "${YELLOW}Note: After uploading, update property-data.json with the blob keys${NC}"
echo "${YELLOW}Then deploy: ./scripts/quick-deploy.sh${NC}"