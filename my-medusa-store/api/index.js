const express = require("express");
const { GracefulShutdownServer } = require("medusa-core-utils");

const loaders = require("@medusajs/medusa/dist/loaders/index").default;

(async () => {
  async function start() {
    const app = express();
    const { container } = await loaders({
      directory: process.cwd(),
      expressApp: app,
      isTest: false,
    });

    const configModule = container.resolve("configModule");
    const port = process.env.PORT ?? configModule.projectConfig.port ?? 9000;

    const server = GracefulShutdownServer.create(
      app.listen(port, (err) => {
        if (err) {
          return;
        }
        console.log(`Server is running on port: ${port}`);
      })
    );

    const gracefulShutDown = () => {
      server
        .shutdown()
        .then(() => {
          console.info("Gracefully stopping the server.");
          process.exit(0);
        })
        .catch((e) => {
          console.error("Error received when shutting down the server.", e);
          process.exit(1);
        });
    };
    process.on("SIGTERM", gracefulShutDown);
    process.on("SIGINT", gracefulShutDown);
  }

  await start();
})();

module.exports = (req, res) => {
  res.status(200).json({ message: "Medusa is running!" });
};