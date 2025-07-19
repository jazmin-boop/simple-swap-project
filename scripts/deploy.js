const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log(" Deploying contracts with address:", deployer.address);

    // Desplegar los tokens
    const Token = await ethers.getContractFactory("TestToken");

    const tokenA = await Token.deploy("TokenA", "TKA", 18);
    await tokenA.waitForDeployment();
    console.log(" TokenA deployed to:", tokenA.target);

    const tokenB = await Token.deploy("TokenB", "TKB", 18);
    await tokenB.waitForDeployment();
    console.log("TokenB deployed to:", tokenB.target);

    // Desplegar el contrato de intercambio
    const Swap = await ethers.getContractFactory("SimpleSwap");
    const swap = await Swap.deploy();
    await swap.waitForDeployment();
    console.log(" SimpleSwap deployed to:", swap.target);

    // Crear archivo .env
    const envContent = `VITE_TOKENA_ADDRESS=${tokenA.target}
VITE_TOKENB_ADDRESS=${tokenB.target}
VITE_SWAP_ADDRESS=${swap.target}
`;

    fs.writeFileSync(path.join(__dirname, "../.env"), envContent);
    console.log(" .env file created with contract addresses.");
}

main().catch((error) => {
    console.error(" Deployment failed:", error);
    process.exitCode = 1;
});
