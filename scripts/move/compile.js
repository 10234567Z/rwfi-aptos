require("dotenv").config();
const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

async function compile() {
  const move = new cli.Move();

  await move.compile({
    packageDirectoryPath: "contract",
    namedAddresses: {
      // Compile module with account address
      invreg_addr: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
      stablecoin: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
      master_minter: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
      minter: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
      pauser: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
      denylister: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
    },
  });
}
compile();
