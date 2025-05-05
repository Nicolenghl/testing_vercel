# Vercel Deployment Guide for GreenDish Application

## Prerequisites
1. A Vercel account (https://vercel.com)
2. The Vercel CLI installed (optional but useful for troubleshooting)
   ```
   npm install -g vercel
   ```

## Steps to Deploy

### 1. Push Your Code to GitHub
Make sure your project is pushed to a GitHub repository.

### 2. Connect to Vercel
- Log in to your Vercel account
- Click "Add New" → "Project"
- Import your GitHub repository
- Configure the project settings:
  - Framework Preset: Next.js
  - Root Directory: ./
  - Build Command: next build
  - Output Directory: .next

### 3. Environment Variables
Add the following environment variables in the Vercel project settings:
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Your GreenDish contract address on Axiomesh Gemini network
  Default value: 0x77b9Ac908425F2dfDD9E1b912323501D9A739B83

### 4. Deploy
Click "Deploy" and wait for the build to complete.

## Troubleshooting

### Contract Connection Issues
- Make sure the contract address is correct
- Check that the Axiomesh Gemini network is accessible
- Verify the ABI matches the deployed contract

### Build Failures
If your build fails on Vercel:
1. Check the build logs
2. Make sure all dependencies are properly listed in package.json
3. Verify there are no environment-specific code paths that would break in Vercel's build environment

### Using the Vercel CLI
For local debugging:
```
vercel login
vercel
```

To deploy to production:
```
vercel --prod
```

## Monitoring and Analytics
After deployment, you can monitor your application:
- Performance metrics in the Vercel dashboard
- Error logging in the Vercel logs
- Usage analytics if connected to Vercel Analytics

## Updating Your Deployment
Any push to your default branch will trigger a new deployment automatically if you've set up the GitHub integration. 