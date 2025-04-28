import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build the frontend
console.log('Building the frontend...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Frontend build error: ${error.message}`);
    return;
  }
  if (stderr) console.error(`Frontend build stderr: ${stderr}`);
  console.log(`Frontend build stdout: ${stdout}`);
  console.log('Frontend build completed.');
  
  // Ensure environment variables are set in production
  console.log('Checking environment variables...');
  const requiredVars = [
    'VITE_VEHICLE_API_URL',
    'VITE_VEHICLE_API_KEY',
    'GLASS_API_LOGIN',
    'GLASS_API_PASSWORD'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.warn(`Warning: The following environment variables are not set: ${missingVars.join(', ')}`);
    console.warn('Make sure they are set in your Vercel project settings.');
  } else {
    console.log('All required environment variables are defined.');
  }
  
  // Create a minimal package.json for production if not exists
  const prodPackagePath = path.join(__dirname, 'dist', 'package.json');
  if (!fs.existsSync(prodPackagePath)) {
    console.log('Creating production package.json...');
    const prodPackage = {
      "name": "glassorderhub",
      "type": "module",
      "dependencies": {
        "express": "^5.1.0",
        "dotenv": "^16.5.0",
        "cors": "^2.8.5",
        "axios": "^1.8.4"
      }
    };
    
    fs.writeFileSync(prodPackagePath, JSON.stringify(prodPackage, null, 2));
  }
  
  console.log('Build process completed successfully.');
}); 