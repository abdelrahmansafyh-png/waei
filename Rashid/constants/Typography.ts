export const Typography = {
  heroTitle: "fs-hero-title",
  pageTitle: "fs-page-title",
  sectionTitle: "fs-section-title",
  sectionTitleSmall: "fs-section-title-sm",
  cardTitle: "fs-card-title",
  cardTitleSmall: "fs-card-title-sm",
  sidebarTitle: "fs-sidebar-title",
  bodyLarge: "fs-body-lg",
  body: "fs-body",
  bodySmall: "fs-body-sm",
  caption: "fs-caption",
  button: "fs-button",
  nav: "fs-nav",
} as const;

export type RashidTypographyKey = keyof typeof Typography;
