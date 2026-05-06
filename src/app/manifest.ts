import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Learn Japan",
    short_name: "Learn Japan",
    description: "Mobile-first Japanese learning app with SRS review and quiz drills",
    start_url: "/",
    display: "standalone",
    background_color: "#f6efe5",
    theme_color: "#14532d",
    orientation: "portrait",
    lang: "en",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
