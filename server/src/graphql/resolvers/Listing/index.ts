import { ObjectId } from "mongodb";
import { Database, Listing } from "../../../lib/types";

export const listingResolvers = {
  Query: {
    listings: async (
      _root: undefined,
      args: {},
      { db }: { db: Database }
    ): Promise<Listing[]> => {
      return await db.listings.find({}).toArray();
    },
  },
  Mutation: {
    deleteListing: async (
      _root: undefined,
      { id }: { id: string },
      { db }: { db: Database }
    ): Promise<Listing> => {
      const deleteRes = await db.listings.findOneAndDelete({
        _id: new ObjectId(id),
      });
      if (!deleteRes) {
        throw new Error("failed to delete listing");
      }
      return deleteRes;
    },
  },
  Listing: {
    id: (listing: Listing): string => {
      return listing._id.toString();
    },
  },
};
