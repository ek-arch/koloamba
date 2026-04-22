/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Force HTTPS for 2 years, include subdomains, allow preload list submission.
  // Vercel's edge already serves HSTS on custom domains; setting it in-app
  // ensures the header is present regardless of domain/edge config.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Deny framing entirely (clickjacking protection). We never embed the app
  // in an iframe; flip to SAMEORIGIN if that ever changes.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers from MIME-sniffing responses away from the declared type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send origin (not full URL) on cross-origin nav; keep full referrer
  // same-origin so analytics / deep-links still work.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down powerful features we don't use.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
