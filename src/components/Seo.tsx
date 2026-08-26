import { Helmet } from "react-helmet-async";
import { absoluteUrl, SITE_NAME, truncate } from "@/lib/seo";

interface SeoProps {
  title: string;
  description: string;
  /** Route path, e.g. "/store/sharma-general-store-bhilai" */
  path: string;
  image?: string;
  type?: "website" | "article" | "product" | "profile";
  noindex?: boolean;
  /** One or more JSON-LD objects rendered as structured data */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const Seo = ({ title, description, path, image, type = "website", noindex, jsonLd }: SeoProps) => {
  const url = absoluteUrl(path);
  const desc = truncate(description);
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}

      {blocks.map((block, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
