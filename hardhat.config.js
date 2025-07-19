require("@nomicfoundation/hardhat-toolbox");
require("hardhat-abi-exporter");
require("hardhat-coverage");

module.exports = {
  solidity: "0.8.20",
  solidity:"0.8.28",
  abiExporter: {
    path: './frontend/abis',
    runOnCompile: true,
    clear: true,
    flat: true,
    only: ['SimpleSwap']
  }
};
