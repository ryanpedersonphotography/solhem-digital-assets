import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the property data
const dataPath = path.join(__dirname, 'public', 'property-data.json');
const propertyData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔧 Fixing asset issues...\n');

let fixes = 0;

// Fix 1: Add missing suites from assets to property suite lists
propertyData.properties.forEach(property => {
  if (!property.assets || !property.assets.suites) return;
  
  const suiteKeys = Object.keys(property.assets.suites);
  const existingSuites = property.suites || [];
  const missingSuites = [];
  
  suiteKeys.forEach(suiteKey => {
    // Check if this suite exists in the property's suite list
    const exists = existingSuites.some(suite => {
      // Handle both "Suite 190" and "190" formats
      return suite === suiteKey || suite === `Suite ${suiteKey}` || suite.replace(/^Suite\s+/, '') === suiteKey;
    });
    
    if (!exists) {
      missingSuites.push(suiteKey);
    }
  });
  
  if (missingSuites.length > 0) {
    console.log(`📝 ${property.address}:`);
    console.log(`   Adding missing suites: ${missingSuites.join(', ')}`);
    property.suites = [...existingSuites, ...missingSuites].sort();
    fixes++;
  }
});

// Fix 2: Add missing suite entries to the suites array
const existingSuiteEntries = new Set(
  propertyData.suites.map(s => `${s.property}|${s.unit}`)
);

const newSuiteEntries = [];

propertyData.properties.forEach(property => {
  if (!property.assets || !property.assets.suites) return;
  
  Object.keys(property.assets.suites).forEach(suiteKey => {
    // Check if this suite exists in the suites data
    const suiteExists = propertyData.suites.some(s => 
      s.property === property.address && 
      (s.unit === suiteKey || s.unit === `Suite ${suiteKey}` || s.unit.replace(/^Suite\s+/, '') === suiteKey)
    );
    
    if (!suiteExists) {
      newSuiteEntries.push({
        property: property.address,
        unit: suiteKey,
        unitType: "Office",
        status: "Unknown",
        sqft: "0"
      });
    }
  });
});

if (newSuiteEntries.length > 0) {
  console.log(`\n📋 Adding ${newSuiteEntries.length} missing suite entries:`);
  newSuiteEntries.forEach(suite => {
    console.log(`   ${suite.property} - Suite ${suite.unit}`);
  });
  propertyData.suites.push(...newSuiteEntries);
  fixes += newSuiteEntries.length;
}

// Fix 3: Special case for 8409-8421 Center Drive - rename 8049 to 8409
const centerDriveProperty = propertyData.properties.find(p => 
  p.id === '8409-8421-center-drive-spring-lake-park'
);

if (centerDriveProperty && centerDriveProperty.assets.suites['8049']) {
  console.log('\n🔄 8409-8421 Center Drive Spring Lake Park:');
  console.log('   Renaming suite assets from 8049 to 8409');
  centerDriveProperty.assets.suites['8409'] = centerDriveProperty.assets.suites['8049'];
  delete centerDriveProperty.assets.suites['8049'];
  fixes++;
}

// Fix 4: Normalize suite naming in the property suite lists
propertyData.properties.forEach(property => {
  if (!property.suites || property.suites.length === 0) return;
  
  const hasInconsistentNaming = property.suites.some(suite => suite.startsWith('Suite ')) &&
                                property.suites.some(suite => !suite.startsWith('Suite '));
  
  if (hasInconsistentNaming) {
    console.log(`\n🏷️  ${property.address}:`);
    console.log('   Normalizing suite naming to remove "Suite" prefix');
    property.suites = property.suites.map(suite => suite.replace(/^Suite\s+/, ''));
    fixes++;
  }
});

if (fixes === 0) {
  console.log('✅ No issues found to fix!');
} else {
  // Write the fixed data back
  fs.writeFileSync(dataPath, JSON.stringify(propertyData, null, 2));
  console.log(`\n✅ Fixed ${fixes} issues and saved to property-data.json`);
  console.log('\n💡 Remember to rebuild and deploy the application!');
}