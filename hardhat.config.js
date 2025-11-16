import { defineConfig } from "hardhat/config";

export default defineConfig({
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 1337,        // <-- MAINNET CHAIN ID
      currency: "ETH",
    },
  },
  test: {
    solidity: {
      timeout: 40000,
    },
  },
});
