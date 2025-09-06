require("dotenv").config();
const fs = require("node:fs");

const modules = [
        //   invreg_addr: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
        // stablecoin: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
        // master_minter: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
        // minter: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
        // pauser: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
        // denylister: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
        // spv_addr: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
        // admin_addr: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,

  { address: process.env.NEXT_PUBLIC_MODULE_ADDRESS, name: "invreg_addr" },
  { address: process.env.NEXT_PUBLIC_MODULE_ADDRESS, name: "stablecoin" },
  { address: process.env.NEXT_PUBLIC_MODULE_ADDRESS, name: "spv_addr" },
];

async function getAbi() {
  // Wait for 5 seconds to ensure the module is deployed
  await new Promise((resolve) => setTimeout(resolve, 5000));
  modules.forEach((module) => {
    const url = `https://fullnode.${process.env.NEXT_PUBLIC_APP_NETWORK}.aptoslabs.com/v1/accounts/${module.address}/module/${module.name}`;
    fetch(url)
      .then((response) => response.json())
      .then((response) => {
        const abi = response.abi;
        const abiString = `export const ${module.name.toUpperCase()}_ABI = ${JSON.stringify(abi)} as const;`;
        fs.writeFileSync(`src/utils/${module.name}_abi.ts`, abiString);
        console.log(`${module.name} ABI saved to src/utils/${module.name}_abi.ts`);
      })
      .catch((error) => {
        console.error("Error fetching ABI:", error);
      });
  });
}

getAbi();
