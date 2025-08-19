import { Comment } from "./commentType";
export interface Post {
  id: string;
  //   user: {
  //     name: string;
  //     avatar: string;
  //   };
  image: string;
  user: string;
  likes_count: number;
  is_liked: boolean;
  caption: string;
  comments: Comment[];
  time_ago: string;
  location: string;
  tags: string[];
  tenant_id: string;
}
