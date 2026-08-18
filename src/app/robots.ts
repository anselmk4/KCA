import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://ansella.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/courses',
          '/courses/*',
          '/features',
          '/pricing',
          '/templates',
          '/services',
          '/cases',
          '/partners',
          '/about',
          '/instructors',
          '/lms-afrique',
          '/lms-afrique/*',
          '/vs',
          '/vs/*',
          '/blog',
          '/blog/*',
          '/verify/*',
          '/terms',
          '/privacy',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/instructor',
          '/instructor/*',
          '/dashboard',
          '/dashboard/*',
          '/api/*',
          '/auth/callback',
          '/auth/confirmed',
          '/auth/reset-password',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/courses', '/courses/*', '/blog', '/blog/*', '/lms-afrique/*'],
        disallow: ['/admin/*', '/instructor/*', '/dashboard/*', '/api/*'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
