import dotenv from 'dotenv';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process
  throw new Error("⚠️ Couldn't find .env file ⚠️");
}

export default {
    eth: process.env.ETHEREUM_MAINNET,
    bnb: process.env.BINANCE_MAINNET,
    matic: process.env.POLYGON_MAINNET
}