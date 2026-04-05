import type { NextConfig } from "next";

// Build a dynamic CSP that works across environments (local, Vercel preview, production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseWss = supabaseUrl.replace('https://', 'wss://');
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL ? new URL(process.env.UPSTASH_REDIS_REST_URL).origin : '';

const cspDirectives = [
  "default-src 'self'",
  // Removemos unsafe-eval pero mantenemos unsafe-inline temporalmente para React
  // TODO: Migrar a nonces en el futuro
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Permitir conexiones a Supabase y Upstash Redis
  `connect-src 'self' ${supabaseUrl} ${supabaseWss} ${upstashUrl}`.trim(),
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // Prevenir carga de recursos externos no autorizados
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Upgrade insecure requests en producción
  process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : "",
  // Frame ancestors (prevenir clickjacking)
  "frame-ancestors 'none'",
].filter(Boolean).join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
