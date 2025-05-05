/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    // This helps with some Vercel-specific optimizations
    output: 'standalone',
    // Make sure environment variables are properly handled
    env: {
        NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    }
}

module.exports = nextConfig






