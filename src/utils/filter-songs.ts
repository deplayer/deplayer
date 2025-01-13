const filterSongs = (
  songs: any,
  term: string = ""
) => {
  if (!songs) {
    [];
  }

  if (term === "" && songs) {
    return Object.keys(songs);
  }

  const mappedResults = songs.map((song: any) => {
    return song.id;
  });

  return mappedResults;
};

export default filterSongs;
