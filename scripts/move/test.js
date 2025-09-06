require("dotenv").config();

const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

async function test() {
  const move = new cli.Move();

  await move.test({
    packageDirectoryPath: "contract",
    namedAddresses: {
      invreg_addr: "0x100",
      stablecoin: "0x200",
      master_minter: "0x300",
      minter: "0x400",
      pauser: "0x500",
      denylister: "0x600",
      spv_addr: "0x700",
      admin_addr: "0x800",
    },
  });
}
test();
