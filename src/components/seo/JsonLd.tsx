import React from "react";

export interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

export function OrganizationJsonLd({
  name = "ANSELLA",
  url = "https://ansella.app",
  logo = "https://ansella.app/logo.png",
  description = "Global LMS and online learning platform specialized in AI, Tech, Web3, and professional certification.",
  sameAs = [
    "https://twitter.com/ansella_app",
    "https://linkedin.com/company/ansella",
    "https://facebook.com/ansella.app"
  ],
}: OrganizationJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name,
    url,
    logo,
    description,
    sameAs,
    address: {
      "@type": "PostalAddress",
      addressCountry: "CD",
      addressLocality: "Bukavu",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+243990387237",
      contactType: "customer service",
      availableLanguage: ["French", "English"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export interface CourseJsonLdProps {
  title: string;
  description: string;
  instructorName: string;
  price?: number;
  currency?: string;
  url: string;
  imageUrl?: string;
  category?: string;
}

export function CourseJsonLd({
  title,
  description,
  instructorName,
  price = 0,
  currency = "USD",
  url,
  imageUrl = "https://ansella.app/og-image-final.png",
  category = "Technology",
}: CourseJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: title,
    description,
    provider: {
      "@type": "Organization",
      name: "ANSELLA",
      sameAs: "https://ansella.app",
    },
    instructor: {
      "@type": "Person",
      name: instructorName,
    },
    image: imageUrl,
    offers: {
      "@type": "Offer",
      price: price.toString(),
      priceCurrency: currency,
      category,
      availability: "https://schema.org/InStock",
      url,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: "PT10H",
    },
    educationalCredentialAwarded: {
      "@type": "EducationalOccupationalCredential",
      name: `Certificat Officiel — ${title}`,
      credentialCategory: "Certificate of Completion",
      recognizedBy: {
        "@type": "EducationalOrganization",
        name: "ANSELLA",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbsJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
