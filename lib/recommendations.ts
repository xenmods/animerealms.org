export async function getAnimeRecommendations(mediaId: number) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        recommendations(sort: [RATING_DESC, ID_DESC], page: 1, perPage: 20) {
          nodes {
            mediaRecommendation {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
                medium
                color
              }
              bannerImage
              status(version: 2)
              episodes
              averageScore
              format
              seasonYear
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        id: mediaId,
      },
    }),
  });

  if (!res.ok) {
    console.error("Failed to fetch recommendations", await res.text());
    return [];
  }

  const json = await res.json();
  // Extract the mediaRecommendation objects from the nodes
  const recommendations = json.data?.Media?.recommendations?.nodes
    ?.map((node: any) => node.mediaRecommendation)
    .filter((media: any) => media !== null); // Filter out nulls if any

  return recommendations || [];
}
