import { MetadataRoute } from 'next';
import { AFRICAN_COUNTRIES_SEO } from '@/data/geo-countries';
import { COMPETITORS_SEO } from '@/data/competitors';
import { BLOG_POSTS_SEO } from '@/data/blog-posts';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ansella.app';
  const lastModified = new Date();

  // 1. Static Core Landing Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cases`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/instructors`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/lms-afrique`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vs`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 2. Programmatic African Countries Landing Pages (/lms-afrique/[country])
  const geoRoutes: MetadataRoute.Sitemap = AFRICAN_COUNTRIES_SEO.map((country) => ({
    url: `${baseUrl}/lms-afrique/${country.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 3. Competitor Comparison Pages (/vs/[competitor])
  const vsRoutes: MetadataRoute.Sitemap = COMPETITORS_SEO.map((comp) => ({
    url: `${baseUrl}/vs/${comp.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 4. Blog Posts & Strategic Guides (/blog/[slug])
  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS_SEO.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  // 5. Dynamic Courses from Supabase Database (/courses/[id])
  let dynamicCourseRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id, updated_at, created_at')
      .eq('status', 'PUBLISHED');

    if (courses && courses.length > 0) {
      dynamicCourseRoutes = courses.map((c) => ({
        url: `${baseUrl}/courses/${c.id}`,
        lastModified: new Date(c.updated_at || c.created_at || lastModified),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.warn('[sitemap] could not fetch dynamic courses:', err);
  }

  return [
    ...staticRoutes,
    ...geoRoutes,
    ...vsRoutes,
    ...blogRoutes,
    ...dynamicCourseRoutes,
  ];
}
