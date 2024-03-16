export const viewerResolvers = {
  Query: {
    authUrl: () => {
      return "Query.authUrl";
    },
  },
  Mutation: {
    logIn: () => {
      return "Mutation.logIn";
    },
    logOut: () => {
      return "Mutation.logOut";
    },
  },
};
