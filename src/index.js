import web3 from "web3";
import rpc from "./config/constants/rpc.js";
import dex from "./config/constants/dex.js";
import contract from "./config/constants/contract.js";
import fs from 'fs';
import { getPrice, decodePriceResult, getChainDetails, singleRoute, twoRoute, decodePairResult } from "./utils/index.js";
import { multiCallAbi, factoryAbi, routerAbi } from "./config/abi/index.js";
import { primeRoute } from "./config/constants/primeRoute.js";

const chain = "bnb"  // eth,bnb,matic
const fromToken = "0x0bc89aa98Ad94E6798Ec822d0814d934cCD0c0cE";
const toToken   = "0xCfFD4D3B517b77BE32C76DA768634dE6C738889B";
const amountIn = "1000000000000000000";

// var pairFile = fs.createWriteStream('pair.txt', {flags: 'a'});
// pairFile.write(`\n"${pairAddress}",`);

const getData = getChainDetails(chain);

const currentWeb3 = new web3(new web3.providers.HttpProvider(rpc[chain]));
const multicallInstance = new currentWeb3.eth.Contract(multiCallAbi,contract.multicall[getData.chainId]);
const routerInstance = new currentWeb3.eth.Contract(routerAbi,dex[getData.defaultDex].router);
const factoryInstance = new currentWeb3.eth.Contract(factoryAbi,dex[getData.defaultDex].factory);

const singleRouteCheck = async() => {
    let oneRouteParams = singleRoute(dex[getData.defaultDex].factory,fromToken,toToken);
    let oneRouteResponse = await multicallInstance.methods.aggregate(oneRouteParams).call();
    let result = decodePairResult(oneRouteResponse.returnData[0]);

    if(result != 0) {
        console.log("Find Slot One", result);
        return result;
    }
    console.log("Single Route Not Found");
}

const twoRouteChcek = async() => {
    let twoRouteParams = twoRoute(dex[getData.defaultDex].factory,getData.nativeCoin,getData.chainId,fromToken,toToken);
    let twoRouteResponse  = await multicallInstance.methods.aggregate(twoRouteParams).call();

    let totalTwoRoutePair = [];
    for(let i=0;i<twoRouteResponse.returnData.length;i++) {        
        let decodeOne = decodePairResult(twoRouteResponse.returnData[i]);
        let decodeTwo = decodePairResult(twoRouteResponse.returnData[++i]);

        if(decodeOne != 0 && decodeTwo != 0) { 
            let pair = {};
            if(i < 2) {
                pair["coin"] = getData.nativeCoin;
                pair["path"] = [fromToken,contract[getData.nativeCoin][getData.chainId],toToken];
            } else if (i < 4) {
                pair["coin"] = primeRoute[1];
                pair["path"] = [fromToken,contract[primeRoute[1]][getData.chainId],toToken];
            } else if (i < 6) {
                pair["coin"] = primeRoute[2];
                pair["path"] = [fromToken,contract[primeRoute[2]][getData.chainId],toToken];
            }
            totalTwoRoutePair.push(pair);
        }
    }

    let getPriceParams = getPrice(dex[getData.defaultDex].router,amountIn,totalTwoRoutePair);
    let getPriceResponse  = await multicallInstance.methods.aggregate(getPriceParams).call();
    let finalResultForTwoRoute = {};
    finalResultForTwoRoute["price"] = 0;
    for(let i=0;i<getPriceResponse.returnData.length;i++) {
        let decodePrice = decodePriceResult(getPriceResponse.returnData[i]);
        let price = Number(decodePrice.amounts[2]);

        if(finalResultForTwoRoute["price"] < price) {
            finalResultForTwoRoute["price"] = price;
            finalResultForTwoRoute["coin"] = totalTwoRoutePair[i]["coin"];
            finalResultForTwoRoute["path"] = totalTwoRoutePair[i]["path"];
        }
    }

    console.log("finalResultForTwoRoute", finalResultForTwoRoute);
}


const getPair = async() => {
    await singleRouteCheck();
    await twoRouteChcek();
    console.log("close");
}


(async() => {
    await getPair();
})();