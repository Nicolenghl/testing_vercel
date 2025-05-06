/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    // This helps with some Vercel-specific optimizations
    output: 'standalone',
    // Make sure environment variables are properly handled
    env: {
        NEXT_PUBLIC_CONTRACT_ADDRESS: '0x6AB06cf2cC7caEd0689E5D914e060F8e014C62c0'
    }
}

module.exports = nextConfig






