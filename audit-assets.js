#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Load property data
const dataPath = path.join(__dirname, 'public', 'property-data.json');
const propertyData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Audit results
const results = {
  suitesWithoutAssets: [],
  assetsWithoutSuites: [],
  namingMismatches: [],
  totalProperties: 0,
  propertiesWithSuites: 0,
  totalSuitesListed: 0,
  totalSuiteAssets: 0
};

console.log(`${colors.bold}${colors.blue}=== Property Data Asset Audit ===${colors.reset}\n`);

// Process each property
propertyData.properties.forEach(property => {
  results.totalProperties++;
  
  const propertyIssues = {
    id: property.id,
    address: property.address,
    suitesWithoutAssets: [],
    assetsWithoutSuites: [],
    namingMismatches: []
  };
  
  // Get suites from the property's suites array
  const listedSuites = property.suites || [];
  
  // Get suites that have assets
  const assetsKeys = Object.keys(property.assets.suites || {});
  
  if (listedSuites.length > 0) {
    results.propertiesWithSuites++;
    results.totalSuitesListed += listedSuites.length;
  }
  
  results.totalSuiteAssets += assetsKeys.length;
  
  // Check for suites listed but without assets
  listedSuites.forEach(suite => {
    if (!assetsKeys.includes(suite)) {
      propertyIssues.suitesWithoutAssets.push(suite);
    }
  });
  
  // Check for assets without corresponding suite listing
  assetsKeys.forEach(assetKey => {
    if (!listedSuites.includes(assetKey)) {
      propertyIssues.assetsWithoutSuites.push(assetKey);
    }
  });
  
  // Check for naming format consistency in assets
  if (property.assets.suites) {
    Object.entries(property.assets.suites).forEach(([suiteName, suiteAssets]) => {
      if (Array.isArray(suiteAssets)) {
        suiteAssets.forEach(assetPath => {
          const pathParts = assetPath.split('/');
          
          if (pathParts.length === 2) {
            const [folderName, fileName] = pathParts;
            
            // Check if folder name matches suite name
            if (folderName !== suiteName) {
              propertyIssues.namingMismatches.push({
                suite: suiteName,
                asset: assetPath,
                issue: 'Folder name does not match suite name'
              });
            }
            
            // Check if file naming convention is followed
            // Expected format: {propertyId}_suite_{suiteName}_interior_XXX.jpg
            // Note: The property ID might have underscores replaced with empty string in some cases
            const propertyIdVariants = [
              property.id,
              property.id.replace(/-/g, '_'), // hyphens to underscores
              property.id.replace(/-/g, '') // remove hyphens completely
            ];
            
            const hasValidNaming = propertyIdVariants.some(idVariant => {
              const expectedFilePrefix = `${idVariant}_suite_${suiteName}_`;
              return fileName.startsWith(expectedFilePrefix);
            });
            
            if (!hasValidNaming) {
              // Check if it's just missing "suite_" part
              const simplifiedCheck = propertyIdVariants.some(idVariant => {
                return fileName.startsWith(`${idVariant}_${suiteName}_`);
              });
              
              if (!simplifiedCheck) {
                propertyIssues.namingMismatches.push({
                  suite: suiteName,
                  asset: assetPath,
                  issue: 'File name does not follow expected convention'
                });
              }
            }
          } else {
            propertyIssues.namingMismatches.push({
              suite: suiteName,
              asset: assetPath,
              issue: 'Unexpected path format (should be folder/filename)'
            });
          }
        });
      }
    });
  }
  
  // Add to results if issues found
  if (propertyIssues.suitesWithoutAssets.length > 0 ||
      propertyIssues.assetsWithoutSuites.length > 0 ||
      propertyIssues.namingMismatches.length > 0) {
    
    if (propertyIssues.suitesWithoutAssets.length > 0) {
      results.suitesWithoutAssets.push({
        property: property.address,
        propertyId: property.id,
        suites: propertyIssues.suitesWithoutAssets
      });
    }
    
    if (propertyIssues.assetsWithoutSuites.length > 0) {
      results.assetsWithoutSuites.push({
        property: property.address,
        propertyId: property.id,
        suites: propertyIssues.assetsWithoutSuites
      });
    }
    
    if (propertyIssues.namingMismatches.length > 0) {
      results.namingMismatches.push({
        property: property.address,
        propertyId: property.id,
        mismatches: propertyIssues.namingMismatches
      });
    }
  }
});

// Generate Report
console.log(`${colors.bold}${colors.cyan}Summary:${colors.reset}`);
console.log(`Total Properties: ${results.totalProperties}`);
console.log(`Properties with Suites: ${results.propertiesWithSuites}`);
console.log(`Total Suites Listed: ${results.totalSuitesListed}`);
console.log(`Total Suite Asset Folders: ${results.totalSuiteAssets}`);
console.log('');

// Report suites without assets
if (results.suitesWithoutAssets.length > 0) {
  console.log(`${colors.bold}${colors.red}❌ Suites Listed But No Assets (${results.suitesWithoutAssets.length} properties):${colors.reset}`);
  results.suitesWithoutAssets.forEach(item => {
    console.log(`\n${colors.yellow}${item.property}${colors.reset} (${item.propertyId})`);
    item.suites.forEach(suite => {
      console.log(`  - Suite "${suite}" has no assets`);
    });
  });
  console.log('');
} else {
  console.log(`${colors.green}✓ All listed suites have corresponding assets${colors.reset}\n`);
}

// Report assets without suite listings
if (results.assetsWithoutSuites.length > 0) {
  console.log(`${colors.bold}${colors.red}❌ Assets Without Suite Listing (${results.assetsWithoutSuites.length} properties):${colors.reset}`);
  results.assetsWithoutSuites.forEach(item => {
    console.log(`\n${colors.yellow}${item.property}${colors.reset} (${item.propertyId})`);
    item.suites.forEach(suite => {
      console.log(`  - Suite assets for "${suite}" but not in suites list`);
    });
  });
  console.log('');
} else {
  console.log(`${colors.green}✓ All suite assets have corresponding suite listings${colors.reset}\n`);
}

// Report naming mismatches
if (results.namingMismatches.length > 0) {
  console.log(`${colors.bold}${colors.red}❌ Naming Format Issues (${results.namingMismatches.length} properties):${colors.reset}`);
  results.namingMismatches.forEach(item => {
    console.log(`\n${colors.yellow}${item.property}${colors.reset} (${item.propertyId})`);
    
    // Group by issue type
    const issueGroups = {};
    item.mismatches.forEach(mismatch => {
      if (!issueGroups[mismatch.issue]) {
        issueGroups[mismatch.issue] = [];
      }
      issueGroups[mismatch.issue].push(mismatch);
    });
    
    Object.entries(issueGroups).forEach(([issue, mismatches]) => {
      console.log(`  ${colors.cyan}${issue}:${colors.reset}`);
      mismatches.slice(0, 3).forEach(m => {
        console.log(`    - Suite "${m.suite}": ${m.asset}`);
      });
      if (mismatches.length > 3) {
        console.log(`    ... and ${mismatches.length - 3} more`);
      }
    });
  });
  console.log('');
} else {
  console.log(`${colors.green}✓ All asset naming follows expected conventions${colors.reset}\n`);
}

// Final summary
console.log(`${colors.bold}${colors.blue}=== Audit Complete ===${colors.reset}`);
const totalIssues = results.suitesWithoutAssets.length + 
                   results.assetsWithoutSuites.length + 
                   results.namingMismatches.length;

if (totalIssues === 0) {
  console.log(`${colors.green}✓ No issues found! All suites and assets are properly configured.${colors.reset}`);
} else {
  console.log(`${colors.red}Found issues in ${totalIssues} properties${colors.reset}`);
  console.log(`  - ${results.suitesWithoutAssets.length} properties with suites missing assets`);
  console.log(`  - ${results.assetsWithoutSuites.length} properties with assets missing suite listings`);
  console.log(`  - ${results.namingMismatches.length} properties with naming format issues`);
}

// Export results to JSON file if requested
const exportFlag = process.argv.includes('--export');
if (exportFlag) {
  const exportPath = path.join(__dirname, 'audit-results.json');
  fs.writeFileSync(exportPath, JSON.stringify(results, null, 2));
  console.log(`\n${colors.cyan}Results exported to: ${exportPath}${colors.reset}`);
}

console.log('\nRun with --export flag to save detailed results to audit-results.json');