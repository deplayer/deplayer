export type SmartPlaylist = {
  id: string;
  name: string;
  filters: {
    genres: string[];
    types: string[];
    artists: string[];
    providers: string[];
  };
  createdAt: Date;
} 