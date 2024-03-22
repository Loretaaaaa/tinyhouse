import crypto from "crypto";
import { Viewer, Database, User } from "../../../lib/types";
import { Google } from "../../../lib/api";
import { LogInArgs } from "./types";
import { ObjectId } from "mongodb";

const logInViaGoogle = async (
  code: string,
  token: string,
  db: Database
): Promise<User | undefined> => {
  const { user } = await Google.logIn(code);
  if (!user) {
    throw new Error("Google login error");
  }

  // Names/Photos/Emails
  const userNamesList = user.names?.length ? user.names : null;
  const userPhotosList = user.photos?.length ? user.photos : null;
  const userEmailsList = user.emailAddresses?.length
    ? user.emailAddresses
    : null;

  // User display name
  const userName = userNamesList?.[0]?.displayName ?? null;

  // User id
  const userId = userNamesList?.[0]?.metadata?.source?.id ?? null;

  // User avatar
  const userAvatar = userPhotosList?.[0]?.url ?? null;

  // User email
  const userEmail = userEmailsList?.[0]?.value ?? null;

  if (!userId || !userName || !userAvatar || !userEmail) {
    throw new Error("Google login error");
  }

  const updateRes = await db.users.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    {
      $set: {
        name: userName,
        avatar: userAvatar,
        contact: userEmail,
        token,
      },
    },
    { returnDocument: "after" }
  );

  let viewer = updateRes;

  if (!viewer) {
    const insertResult = await db.users.insertOne({
      _id: new ObjectId(userId),
      token,
      name: userName,
      avatar: userAvatar,
      contact: userEmail,
      walletId: undefined,
      income: 0,
      bookings: [],
      listings: [],
    });

    viewer = await db.users.findOne({ _id: insertResult.insertedId });
  }
  return viewer || undefined;
};

export const viewerResolvers = {
  Query: {
    authUrl: (): string => {
      try {
        return Google.authUrl;
      } catch (error) {
        throw new Error(`Failed to query Google Auth Url: ${error}`);
      }
    },
  },

  Mutation: {
    logIn: async (
      _root: undefined,
      { input }: LogInArgs,
      { db }: { db: Database }
    ): Promise<Viewer> => {
      try {
        const code = input ? input.code : null;
        const token = crypto.randomBytes(16).toString("hex");
        const viewer: User | undefined = code
          ? await logInViaGoogle(code, token, db)
          : undefined;
        if (!viewer) {
          return { didRequest: true };
        }
        return {
          _id: viewer._id.toHexString(),
          token: viewer.token,
          avatar: viewer.avatar,
          walletId: viewer.walletId,
          didRequest: true,
        };
      } catch (error) {
        throw new Error(`Failed to log in: ${error}`);
      }
    },
    logOut: (): Viewer => {
      try {
        return { didRequest: true };
      } catch (error) {
        throw new Error(`Failed to log out: ${error}`);
      }
    },
  },

  Viewer: {
    id: (viewer: Viewer): string | undefined => {
      return viewer._id;
    },
    hasWallet: (viewer: Viewer): boolean | undefined => {
      return viewer.walletId ? true : undefined;
    },
  },
};
