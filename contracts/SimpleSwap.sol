// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract SimpleSwap is ReentrancyGuard {
    using Math for uint256;

    struct Pool {
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidityBalance;
    }

    mapping(bytes32 => Pool) public pools;

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "Identical addresses");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Zero address");
    }

    function getPoolId(address tokenA, address tokenB) public pure returns (bytes32) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        return keccak256(abi.encodePacked(token0, token1));
    }

    function addLiquidity(
    address tokenA,
    address tokenB,
    uint amountADesired,
    uint amountBDesired,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline   
) external nonReentrant returns (uint amountA, uint amountB, uint liquidity) {
    require(block.timestamp <= deadline, "Deadline passed");
    require(amountADesired >= amountAMin && amountBDesired >= amountBMin, "Slippage too high");

    (address token0, ) = sortTokens(tokenA, tokenB);
    Pool storage pool = pools[getPoolId(token0, tokenB)];

    IERC20(tokenA).transferFrom(msg.sender, address(this), amountADesired);
    IERC20(tokenB).transferFrom(msg.sender, address(this), amountBDesired);

    if (pool.totalLiquidity == 0) {
        liquidity = Math.sqrt(amountADesired * amountBDesired);
    } else {
        liquidity = Math.min(
            (amountADesired * pool.totalLiquidity) / (tokenA == token0 ? pool.reserve0 : pool.reserve1),
            (amountBDesired * pool.totalLiquidity) / (tokenA == token0 ? pool.reserve1 : pool.reserve0)
        );
    }

    if (tokenA == token0) {
        pool.reserve0 += amountADesired;
        pool.reserve1 += amountBDesired;
    } else {
        pool.reserve0 += amountBDesired;
        pool.reserve1 += amountADesired;
    }

    pool.totalLiquidity += liquidity;
    pool.liquidityBalance[to] += liquidity;

    return (amountADesired, amountBDesired, liquidity);
}


    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external nonReentrant returns (uint amountA, uint amountB) {
        require(block.timestamp <= deadline, "Deadline passed");

        (address token0, address token1) = sortTokens(tokenA, tokenB);
        bytes32 poolId = getPoolId(token0, token1);
        Pool storage pool = pools[poolId];
        require(pool.liquidityBalance[msg.sender] >= liquidity, "Not enough liquidity");

        uint reserve0 = pool.reserve0;
        uint reserve1 = pool.reserve1;

        amountA = (liquidity * reserve0) / pool.totalLiquidity;
        amountB = (liquidity * reserve1) / pool.totalLiquidity;

        require(amountA >= amountAMin && amountB >= amountBMin, "Slippage too high");

        pool.reserve0 -= amountA;
        pool.reserve1 -= amountB;
        pool.totalLiquidity -= liquidity;
        pool.liquidityBalance[msg.sender] -= liquidity;

        if (tokenA == token0) {
            IERC20(tokenA).transfer(to, amountA);
            IERC20(tokenB).transfer(to, amountB);
        } else {
            IERC20(tokenA).transfer(to, amountB);
            IERC20(tokenB).transfer(to, amountA);
        }

        return (amountA, amountB);
    }

    event SwapExecuted(address indexed user, address tokenIn, address tokenOut, uint amountIn, uint amountOut);

    function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external nonReentrant returns (uint[] memory amounts) {
    require(block.timestamp <= deadline, "Transaction expired");
    require(path.length == 2, "Only 1 hop allowed");
    require(amountIn > 0, "Zero input amount");

    (address token0, address token1) = sortTokens(path[0], path[1]);
    Pool storage pool = pools[getPoolId(token0, token1)];

    uint amountOut = getAmountOut(
        amountIn,
        path[0] == token0 ? pool.reserve0 : pool.reserve1,
        path[0] == token0 ? pool.reserve1 : pool.reserve0
    );

    require(amountOut >= amountOutMin, "Slippage too high");

    IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
    IERC20(path[1]).transfer(to, amountOut);

    if (path[0] == token0) {
        pool.reserve0 += amountIn;
        pool.reserve1 -= amountOut;
    } else {
        pool.reserve1 += amountIn;
        pool.reserve0 -= amountOut;
    }

    emit SwapExecuted(msg.sender, path[0], path[1], amountIn, amountOut);

    amounts = new uint[](2) ;
    amounts[0] = amountIn;
    amounts[1] = amountOut;

    return amounts;
}

    

    function getPrice(address tokenA, address tokenB) external view returns (uint price) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        bytes32 poolId = getPoolId(token0, token1);
        Pool storage pool = pools[poolId];
        require(pool.reserve0 > 0 && pool.reserve1 > 0, "Empty pool");

        if (tokenA == token0) {
            price = (pool.reserve1 * 1e18) / pool.reserve0;
        } else {
            price = (pool.reserve0 * 1e18) / pool.reserve1;
        }
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure returns (uint amountOut) {
        require(amountIn > 0, "Invalid input");
        require(reserveIn > 0 && reserveOut > 0, "Invalid reserves");

        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }
}
