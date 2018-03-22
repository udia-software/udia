import { createServer } from "http";
import { createConnection } from "typeorm";
import app from "./app";
import { NODE_ENV, PORT } from "./constants";

/**
 * Start the server. Initialize the Database Client and tables.
 */
const start = async () => {
  const connection = await createConnection();
  // tslint:disable-next-line no-console
  console.log(
    `Connected to ${connection.options.database} ${connection.options.type}: ${
      connection.isConnected
    }`
  );
  app.set("dbConnection", connection);
  const server = createServer(app);

  server.listen(PORT, async () => {
    // tslint:disable-next-line no-console
    console.log(`UDIA ${NODE_ENV} server running on port ${PORT}`);
  });

  const shutdown = async () => {
    // tslint:disable-next-line no-console
    console.log("\n3)\tShutdown server request received.");
    await connection.close();
    // tslint:disable-next-line no-console
    console.log(`2)\tDatabase connections closed.`);
    await server.close(() => {
      // tslint:disable-next-line no-console
      console.log(`1)\tUDIA server shut down.`);
      return process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGQUIT", shutdown);
  process.on("SIGTERM", shutdown);
};

if (require.main === module) {
  start();
}

export default start;
