# SimpleSwap DApp

## General Description

This is a simple web app where any user can:

- Connect their digital wallet (like MetaMask)
- See the price of one token compared to another
- Swap tokens (exchange one token for another)
- Use a smart contract on a test blockchain

## Technologies Used

The project has two parts: the smart contract (backend) and the web application (frontend).

**Smart Contract:**

- Solidity and Hardhat

**Web Application:**

- React, Vite, and Ethers.js

**Other Tools:**

- GitHub and Vercel

## How the App Works

1. The user opens the web app.
2. The app asks to connect a wallet (like MetaMask).
3. After connecting, the user can see the price of Token A vs Token B.
4. The user can swap one token for another.
5. All actions use a smart contract on a test blockchain network.

## Install and Run the Project (optional)

To explore or test the project locally, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/jazmin-boop/simple-swap-project
```
2. Go into the project folder:

```bash
cd simple-swap-project
```
3. Install the dependencies:
 ```bash
   npm install
 ```
4. Run the smart contract tests:
```bash   
   npx hardhat test
```
5. Check the test coverage:
```bash
   npx hardhat coverage
```
6. To run the frontend (React app):
```bash
   cd frontend
   npm install
   npm run dev
```
Then open your browser and go to:
  http://localhost:5173
  
Important Links

Web App: https://simple-swap-project-amber.vercel.app/

GitHub Repository: https://github.com/jazmin-boop/simple-swap-project
