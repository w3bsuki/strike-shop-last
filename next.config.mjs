/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'cdn.sanity.io',
      'medusa-public-images.s3.eu-west-1.amazonaws.com',
      'images.unsplash.com',
    ],
  },
}

export default nextConfig;