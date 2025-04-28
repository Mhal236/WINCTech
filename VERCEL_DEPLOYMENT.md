# Deploying to Vercel

This guide explains how to deploy the Glass Order Hub application to Vercel, ensuring that both the frontend and API server are correctly configured.

## Prerequisites

1. A Vercel account
2. The Vercel CLI installed (optional but recommended)
3. Your environment variables for the vehicle API and glass API

## Files to Include

Make sure the following files are pushed to your repository:

1. `server.js` - Express server that serves both the frontend and API
2. `vercel.json` - Configuration for Vercel deployment
3. `package.json` - Contains dependencies and scripts
4. `src/` - Your source code directory
5. `vite.config.js` - Vite configuration
6. All other project files

## Setting Up Environment Variables

In your Vercel project settings, add the following environment variables:

- `VITE_VEHICLE_API_URL` - URL for the vehicle data API
- `VITE_VEHICLE_API_KEY` - API key for the vehicle data API
- `GLASS_API_LOGIN` - Login for the Glass API
- `GLASS_API_PASSWORD` - Password for the Glass API
- `GLASS_API_USER_ID` - User ID for the Glass API (optional)

## Deployment Steps

### Using Vercel Dashboard

1. Connect your GitHub/GitLab/Bitbucket repository to Vercel
2. Configure the build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Add the environment variables
4. Deploy!

### Using Vercel CLI

1. Install the Vercel CLI if you haven't already:
   ```
   npm i -g vercel
   ```

2. Log in to Vercel:
   ```
   vercel login
   ```

3. Deploy from your project directory:
   ```
   vercel
   ```

4. Follow the prompts to configure your project
5. Use `vercel --prod` for production deployment

## Verifying the Deployment

After deployment, check the following:

1. Visit your deployed site and make sure the frontend loads
2. Test the vehicle lookup functionality with a valid VRN
3. Check Vercel logs for any errors

## Troubleshooting

If you encounter issues:

1. **API Endpoints Not Working**: Check that `vercel.json` is correctly routing all traffic to `server.js`
2. **Environment Variables Missing**: Verify they're set in the Vercel project settings
3. **Server Errors**: Check the Vercel logs for error messages
4. **CORS Issues**: Ensure your `server.js` has proper CORS configuration
5. **Timeout Errors**: Some API calls might need longer timeout settings in Vercel

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Express.js on Vercel](https://vercel.com/guides/using-express-with-vercel)
- [Environment Variables on Vercel](https://vercel.com/docs/concepts/projects/environment-variables) 