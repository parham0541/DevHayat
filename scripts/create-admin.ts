import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { UserRole } from "../src/generated/prisma/enums";

async function main() {
  const name = process.env.ADMIN_NAME || "Dev Admin";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email) {
    throw new Error("ADMIN_EMAIL is not set in .env");
  }

  if (!password) {
    throw new Error("ADMIN_PASSWORD is not set in .env");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existingUser = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    const updatedUser = await db.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        name,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });

    console.log("Admin account updated successfully.");
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Role: ${updatedUser.role}`);

    return;
  }

  const admin = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log("Admin account created successfully.");
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });