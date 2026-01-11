"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function checkUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return; // Don't throw, just return
    }

    // Skip database operations if DATABASE_URL is not set
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, skipping user sync to database");
      return;
    }

    // Check if user exists in database
    const existingUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!existingUser) {
      // Create user in database
      await db.user.create({
        data: {
          clerkUserId: userId,
          email: user.emailAddresses[0].emailAddress,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          imageUrl: user.imageUrl,
        },
      });
    }
  } catch (error) {
    console.error("Error in checkUser:", error);
    // Don't throw to avoid breaking the render
  }
}