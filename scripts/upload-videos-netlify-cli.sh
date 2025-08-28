#!/usr/bin/env bash

# Video Upload Script using Netlify CLI
# This script uploads videos directly to Netlify Blobs using the CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VIDEO_SOURCE_DIR="/Users/ryanpederson/Dev/Video Files"
PROPERTY_ID=${1:-""}

# Property mapping
declare -A PROPERTY_MAP
PROPERTY_MAP["5624-lincoln-drive-edina"]="5624 Lincoln Drive Edina"
PROPERTY_MAP["10740-lyndale-ave-s-bloomington"]="10740 Lyndale Bloomington"
PROPERTY_MAP["10800-lyndale-ave-s-bloomington"]="10800 Lyndale Bloomington"
PROPERTY_MAP["250-st-john-street-loretto"]="250 St John Street Loretto"
PROPERTY_MAP["3558-2nd-st-n-minneapolis"]="3558 2nd St N Minneapolis"
PROPERTY_MAP["6043-hudson-rd-woodbury"]="6043 6053 6063 Hudson Rd Woodbury"
PROPERTY_MAP["7825-washington-ave-bloomington"]="7825 Washington Ave"
PROPERTY_MAP["8409-8421-center-drive-spring-lake-park"]="8409-8421 Center Drive Spring Lake Park"
PROPERTY_MAP["9220-bass-lake-rd-new-hope"]="9220 Bass Lake Rd New Hope"
PROPERTY_MAP["9220-james-ave-s-bloomington"]="9220 James Ave S Bloomington"

echo -e "${BLUE}🎥 Video Upload via Netlify CLI${NC}"
echo -e "${BLUE}================================${NC}"

# Check if netlify CLI is installed
if ! command -v netlify >/dev/null 2>&1; then
    echo -e "${RED}❌ Netlify CLI is not installed${NC}"
    echo -e "${YELLOW}Install with: npm install -g netlify-cli${NC}"
    exit 1
fi

# Function to upload a single video
upload_video() {
    local video_path="$1"
    local blob_key="$2"
    local filename=$(basename "$video_path")
    local size_mb=$(du -m "$video_path" | cut -f1)
    
    # Check if file is over 5GB
    if [ $size_mb -gt 5120 ]; then
        echo -e "${YELLOW}  ⚠️  Skipping $filename (${size_mb}MB - exceeds 5GB limit)${NC}"
        return 1
    fi
    
    echo -e "${BLUE}  📤 Uploading $filename (${size_mb}MB)...${NC}"
    
    if netlify blobs:set property-videos "$blob_key" "$video_path" 2>/dev/null; then
        echo -e "${GREEN}  ✅ Uploaded successfully!${NC}"
        return 0
    else
        echo -e "${RED}  ❌ Failed to upload $filename${NC}"
        return 1
    fi
}

# Function to process a property
process_property() {
    local property_id="$1"
    local folder_name="${PROPERTY_MAP[$property_id]}"
    
    if [ -z "$folder_name" ]; then
        echo -e "${RED}❌ Unknown property ID: $property_id${NC}"
        return 1
    fi
    
    local property_path="$VIDEO_SOURCE_DIR/$folder_name"
    if [ ! -d "$property_path" ]; then
        echo -e "${RED}❌ Property folder not found: $property_path${NC}"
        return 1
    fi
    
    echo -e "\n${YELLOW}📁 Processing $folder_name...${NC}"
    
    # Upload Drone videos
    local drone_paths=("Drone_Videos" "Drone")
    for drone_dir in "${drone_paths[@]}"; do
        local drone_path="$property_path/$drone_dir"
        if [ -d "$drone_path" ]; then
            echo -e "${BLUE}  🚁 Uploading drone videos...${NC}"
            for video in "$drone_path"/*.{MP4,mp4,MOV,mov,AVI,avi} 2>/dev/null; do
                if [ -f "$video" ]; then
                    local filename=$(basename "$video")
                    upload_video "$video" "$property_id/drone/$filename"
                fi
            done
            break
        fi
    done
    
    # Upload Property videos
    local property_paths=("Property_Videos" "Property Videos" "Property")
    for prop_dir in "${property_paths[@]}"; do
        local prop_path="$property_path/$prop_dir"
        if [ -d "$prop_path" ]; then
            echo -e "${BLUE}  🏢 Uploading property videos...${NC}"
            for video in "$prop_path"/*.{MP4,mp4,MOV,mov,AVI,avi} 2>/dev/null; do
                if [ -f "$video" ]; then
                    local filename=$(basename "$video")
                    upload_video "$video" "$property_id/property/$filename"
                fi
            done
            break
        fi
    done
}

# Main execution
if [ -z "$PROPERTY_ID" ]; then
    echo -e "${YELLOW}Usage: $0 <property-id>${NC}"
    echo -e "${YELLOW}Available properties:${NC}"
    for prop_id in "${!PROPERTY_MAP[@]}"; do
        echo "  - $prop_id"
    done | sort
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "netlify.toml" ]; then
    echo -e "${RED}❌ Please run this script from the dam-app directory${NC}"
    exit 1
fi

# Process the property
process_property "$PROPERTY_ID"

echo -e "\n${GREEN}✅ Upload process complete!${NC}"
echo -e "${YELLOW}Don't forget to update property-data.json with the blob keys${NC}"
echo -e "${YELLOW}Then deploy: ./scripts/quick-deploy.sh${NC}"