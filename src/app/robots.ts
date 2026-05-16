import type { MetadataRoute } from "next";

/**
 * robots.txt — app interna, no debe indexarse en ningún buscador.
 * Combina con `metadata.robots = { index: false }` del root layout
 * para cubrir tanto a crawlers que respetan /robots.txt como a los que
 * leen meta-tags del HTML.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                disallow: "/",
            },
        ],
    };
}
