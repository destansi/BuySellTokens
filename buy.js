"use strict";

const Env = require("./env.json");
Object.assign(process.env, Env);

const ethers = require("ethers");

const purchaseToken = process.env.PURCHASE_TOKEN;
const purchaseAmount = ethers.utils.parseUnits(
  process.env.PURCHASE_AMOUNT,
  "ether"
); // buy in BNB
const slippage = process.env.SLIPPAGE;

const wbnb = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const pcs = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const provider = new ethers.providers.WebSocketProvider(
  process.env.BSC_NODE_WSS
);
const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
const account = wallet.connect(provider);

const router = new ethers.Contract(
  pcs,
  [
    "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
    "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable",
  ],
  account
);

async function buy() {
  const amounts = await router.getAmountsOut(purchaseAmount, [
    wbnb,
    purchaseToken,
  ]);
  const amountOutMin = amounts[1].sub(amounts[1].div(slippage));

  console.log(`
    Buying Token
    =================
    tokenIn: ${purchaseAmount.toString()} ${wbnb} (WBNB)
    tokenOut: ${amountOutMin.toString()} ${purchaseToken} 
  `);

  const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
    amountOutMin,
    [wbnb, purchaseToken],
    process.env.RECIPIENT,
    Date.now() + 1000 * 60 * 5, // 5 minutes
    {
      value: purchaseAmount,
      gasLimit: 345684,
      gasPrice: ethers.utils.parseUnits("6", "gwei"),
    }
  );
  console.log("Waiting for Reciept...");
  const receipt = await tx.wait();
  console.log("Transaction receipt");
  console.log(receipt);
  process.exit();
}
buy();
