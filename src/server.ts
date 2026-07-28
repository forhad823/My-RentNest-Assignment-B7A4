import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";
import "dotenv/config";

const PORT = config.port;

async function main() {
  try {
    await prisma.$connect();
    console.log("connected to the database successfully");
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("error starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();

/* 
process.exit() immediately terminates the current Node.js process.

process.exit(0) → Exit successfully.
process.exit(1) → Exit because of an error.
It is useful when a critical startup operation (such as connecting to a database or initializing required services) fails.
*/
