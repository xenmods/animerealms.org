import NextAuth from "next-auth";
import clientPromise from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: "anilist",
      name: "AniList",
      type: "oauth",
      token: "https://anilist.co/api/v2/oauth/token",
      authorization: {
        url: "https://anilist.co/api/v2/oauth/authorize",
        params: {
          scope: "",
          response_type: "code",
          client_id: process.env.ANILIST_ID,
        },
      },
      userinfo: {
        url: "https://graphql.anilist.co",
        async request(context) {
          // console.log(context.tokens.access_token);
          const { data } = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${context.tokens.access_token}`,
            },
            body: JSON.stringify({
              query: `
              query {
                Viewer {
                  id
                  name
                  avatar {
                    large
                    medium
                  }
                  bannerImage
                  mediaListOptions {
                    animeList {
                      customLists
                    }
                  }
                }
              }
            `,
            }),
          }).then((res) => res.json());

          const userLists = data.Viewer?.mediaListOptions.animeList.customLists;

          let custLists = userLists || [];

          if (!userLists?.includes("Watched using Realms")) {
            custLists.push("Watched using Realms");
            const fetchGraphQL = async (
              query: string,
              variables: { lists: any }
            ) => {
              const response = await fetch("https://graphql.anilist.co/", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(context.tokens.access_token && {
                    Authorization: `Bearer ${context.tokens.access_token}`,
                  }),
                },
                body: JSON.stringify({ query, variables }),
              });
              return response.json();
            };

            const customLists = async (lists: any) => {
              const setList = `
                  mutation($lists: [String]){
                    UpdateUser(animeListOptions: { customLists: $lists }){
                      id
                    }
                  }
                `;
              const data = await fetchGraphQL(setList, { lists });
              return data;
            };

            await customLists(custLists);
          }
          // get currently watching list
          const animeList = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${context.tokens.access_token}`,
            },
            body: JSON.stringify({
              query: `
              query {
                Page(page: 1, perPage: 1) {
                  mediaList(userId: ${data.Viewer.id}, type: ANIME, status: CURRENT) {
                    media {
                      id
                      title {
                        romaji
                      }
                    }
                  }
                }
              }
            `,
            }),
          }).then((res) => res.json());

          const currentAnime = animeList.data.Page.mediaList[0]?.media;

          return {
            token: context.tokens.access_token,
            name: data.Viewer.name,
            sub: data.Viewer.id,
            image: data.Viewer.avatar,
            list: [
              ...data.Viewer?.mediaListOptions.animeList.customLists,
              currentAnime,
            ],
          };
        },
      },
      clientId: process.env.ANILIST_ID,
      clientSecret: process.env.ANILIST_SECRET,
      profile(profile) {
        return {
          token: profile.token,
          id: profile.sub,
          provider: "anilist",
          name: profile?.name,
          image: profile.image,
          list: profile?.list,
          version: "1.0.1",
        };
      },
    },
  ],
  session: {
    //Sets the session to use JSON Web Token
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },
    async session({ session, token, user }) {
      session.user = token;
      return session;
    },
    async signIn({ user }) {
      try {
        const client = await clientPromise;
        const db = client.db("animerealms_v2");
        const usersCollection = db.collection("users");

        await usersCollection.updateOne(
          { _id: user.name },
          { $setOnInsert: { _id: user.name } },
          { upsert: true }
        );
      } catch (error) {
        console.error("Error in signIn callback:", error);
      }
      return true;
    },
  },
});
