import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractAbi from "./abis/SimpleSwap.json";
import erc20Abi from "./abis/ERC20.json";
import "./App.css";



const CONTRACT_ADDRESS = import.meta.env.VITE_SWAP_ADDRESS;
const TOKEN_A = import.meta.env.VITE_TOKENA_ADDRESS;
const TOKEN_B = import.meta.env.VITE_TOKENB_ADDRESS;


export default function App() {
  const [account, setAccount] = useState(null);
  const [price, setPrice] = useState("-");
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [status, setStatus] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask no detectado");

    try {
      const acc = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(acc[0]);

      const prov = new ethers.BrowserProvider(window.ethereum);
      const signer = await prov.getSigner();
      console.log("Dirección del contrato:", CONTRACT_ADDRESS);
      const ctr = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

      setProvider(prov);
      setContract(ctr);
      await fetchPrice();
    } catch (err) {
      console.error(" Error al conectar wallet:", err);

    }
  };

  const fetchPrice = async () => {
    if (!contract) return;

    try {
      const result = await contract.getPrice(TOKEN_A, TOKEN_B);
      setPrice(ethers.formatUnits(result, 18));
    } catch {
      try {
        const result = await contract.getPrice(TOKEN_B, TOKEN_A);
        setPrice("1 / " + ethers.formatUnits(result, 18));
      } catch {
        setPrice(" Pool vacío");
      }
    }
  };

  const swap = async () => {
    if (!provider || !contract || !account) {
      setStatus(" Debes conectar tu wallet primero");
      return;
    }
    try {
      setStatus(" Aprobando Token A...");
      const amountIn = ethers.parseUnits("1", 18);
      const deadline = Math.floor(Date.now() / 1000) + 300;
      const signer = await provider.getSigner();
      const tokenA = new ethers.Contract(TOKEN_A, erc20Abi, signer);

      await (await tokenA.approve(CONTRACT_ADDRESS, amountIn)).wait();

      setStatus(" Ejecutando swap...");
      await (await contract.swapExactTokensForTokens(
        amountIn, 0, [TOKEN_A, TOKEN_B], account, deadline
      )).wait();

      setStatus(" Swap completo");
      fetchPrice();
    } catch (err) {
      console.error("ERROR DETECTADO:", err);
      setStatus(" Error: " + (err?.reason || err?.message || "Transacción fallida"));
    }

  };

  const addLiquidity = async () => {
    if (!provider || !contract || !account) {
      setStatus("Debes conectar tu wallet primero");
      return;
    }
    try {
      const amountA = ethers.parseUnits("10", 18);
      const amountB = ethers.parseUnits("20", 18);
      const amountAMin = ethers.parseUnits("9", 18);
      const amountBMin = ethers.parseUnits("18", 18);
      const deadline = Math.floor(Date.now() / 1000) + 600;

      const signer = await provider.getSigner();
      const tokenA = new ethers.Contract(TOKEN_A, erc20Abi, signer);
      const tokenB = new ethers.Contract(TOKEN_B, erc20Abi, signer);

      setStatus("Aprobando Token A...");
      await (await tokenA.approve(CONTRACT_ADDRESS, amountA)).wait();

      setStatus("Aprobando Token B...");
      await (await tokenB.approve(CONTRACT_ADDRESS, amountB)).wait();

      setStatus("Agregando liquidez...");
      await (await contract.addLiquidity(
        TOKEN_A, TOKEN_B, amountA, amountB,
        amountAMin, amountBMin, account, deadline
      )).wait();

      setStatus("Liquidez agregada");
      fetchPrice();
    } catch (err) {
      console.error("ERROR DETECTADO:", err);
      setStatus("Error: " + (err?.reason || err?.message || "Transacción fallida"));
    }

  };

  useEffect(() => {
    console.log(" Verificando variables de entorno:");
    console.log("VITE_SWAP_ADDRESS:", import.meta.env.VITE_SWAP_ADDRESS);
    console.log("VITE_TOKENA_ADDRESS:", import.meta.env.VITE_TOKENA_ADDRESS);
    console.log("VITE_TOKENB_ADDRESS:", import.meta.env.VITE_TOKENB_ADDRESS);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md text-center w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4">SimpleSwap</h1>
        {!account ? (
          <button onClick={connectWallet} className="bg-blue-500 px-4 py-2 text-white rounded">
            Conectar Wallet
          </button>
        ) : (
          <>
            <p className="mb-2">Cuenta: {account}</p>
            <p className="mb-2">Precio Token A en B: {price}</p>
            <p className="mb-4 text-sm text-gray-600">{status}</p>
            <button
              onClick={swap}
              className="bg-green-500 px-4 py-2 text-white rounded mb-2 w-full"
            >
              Intercambiar 1 Token A por B
            </button>
            <button
              onClick={addLiquidity}
              className="bg-purple-600 px-4 py-2 text-white rounded w-full"
            >
              Agregar Liquidez (10 A + 20 B)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
