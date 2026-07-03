export type Program = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  age_range: string | null;
  access_type: string | null;
  categories?: { name: string } | null;
};

export type Tab = {
  id: string;
  title: string;
  type: string;
  sort_order: number;
  guide_title?: string | null;
  guide_description?: string | null;
  award_xp?: boolean | null;
};

export type Content = {
  id: string;
  tab_id: string;
  content_type: string;
  title: string | null;
  body: string | null;
  file_url: string | null;
  youtube_url: string | null;
  iframe_url: string | null;
  game_folder?: string | null;
  sort_order: number;
};

