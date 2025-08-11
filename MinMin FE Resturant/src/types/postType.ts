export interface Post {
  id: string;
  user: string;
  image: string;
  caption: string;
  location: string;
  likes_count: number;
  time_ago: Date;
  comments: string[];
  bookmarks_count: number;
  shares_count: number;
}
