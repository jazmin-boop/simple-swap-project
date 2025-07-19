const { expect } = require("chai");
const { ethers } = require("hardhat");


function sortTokens(tokenA, tokenB) {
  return tokenA.target < tokenB.target
    ? [tokenA, tokenB]
    : [tokenB, tokenA];
}

describe("SimpleSwap", function () {
  let tokenA, tokenB, swap, owner, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("TestToken");
    tokenA = await Token.deploy("TokenA", "TKA", 18);
    tokenB = await Token.deploy("TokenB", "TKB", 18);

    [tokenA, tokenB] = sortTokens(tokenA, tokenB);

    const Swap = await ethers.getContractFactory("SimpleSwap");
    swap = await Swap.deploy();

    const amount1000 = ethers.parseUnits("1000", 18);
    const amount500 = ethers.parseUnits("500", 18);
    const amount490 = ethers.parseUnits("490", 18);
    const amount990 = ethers.parseUnits("990", 18);

    await tokenA.mint(owner.address, amount1000);
    await tokenB.mint(owner.address, amount1000);

    await tokenA.approve(swap.target, amount500);
    await tokenB.approve(swap.target, amount1000);

    await swap.addLiquidity(
      tokenA.target,
      tokenB.target,
      amount500,
      amount1000,
      amount490,
      amount990,
      owner.address,
      Math.floor(Date.now() / 1000) + 600
    );
  });

  it("debería obtener un precio mayor a 0", async () => {
    const price = await swap.getPrice(tokenA.target, tokenB.target);
    expect(price).to.be.gt(0);
  });

  it("debería permitir hacer swap de token A a B", async () => {
    const userAmount = ethers.parseUnits("100", 18);
    const swapAmount = ethers.parseUnits("10", 18);

    await tokenA.mint(user.address, userAmount);
    await tokenA.connect(user).approve(swap.target, swapAmount);

    const path = [tokenA.target, tokenB.target];
    const deadline = Math.floor(Date.now() / 1000) + 600;

    await swap.connect(user).swapExactTokensForTokens(
      swapAmount,
      0,
      path,
      user.address,
      deadline
    );
  });

  it("debería permitir quitar liquidez", async () => {
    const deadline = Math.floor(Date.now() / 1000) + 600;

    const poolId = await swap.getPoolId(tokenA.target, tokenB.target);
    const pool = await swap.pools(poolId);
    const liquidity = pool.totalLiquidity;

    await swap.removeLiquidity(
      tokenA.target,
      tokenB.target,
      liquidity / BigInt(2),
      1,
      1,
      owner.address,
      deadline
    );
  });
});
