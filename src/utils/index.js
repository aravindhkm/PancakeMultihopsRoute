
import { Interface } from '@ethersproject/abi';
import { routerAbi, factoryAbi } from "../config/abi/index.js";
import contract from '../config/constants/contract.js';
import { primeRoute } from '../config/constants/primeRoute.js';

const factoryItf = new Interface(factoryAbi);
const routerItf = new Interface(routerAbi);

export const getPrice = (router,amountIn,args) => {
    let returnData = [];
    for(let i=0;i<args.length;i++) {
        let data = {
            target: router, 
            callData: routerItf.encodeFunctionData("getAmountsOut",[amountIn,args[i].path])
        }
        returnData.push(data);
    }
    return returnData;
}

export const decodePriceResult = (args) => {
    return routerItf.decodeFunctionResult("getAmountsOut", args);
}


export const singleRoute = (factory,fromToken,toToken) => {
    const data = { 
        target: factory, 
        callData: factoryItf.encodeFunctionData("getPair",[fromToken,toToken])
    }

    return [data];
}

export const twoRoute = (factory,native,chainId,fromToken,toToken) => {
    let arrStore = [];

    // native
    arrStore.push({ 
        target: factory, 
        callData: factoryItf.encodeFunctionData("getPair",[fromToken,contract[native][chainId]])
    });
    arrStore.push({ 
        target: factory, 
        callData: factoryItf.encodeFunctionData("getPair",[contract[native][chainId],toToken])
    });


    // prime one
    arrStore.push({ 
        target: factory, 
        callData: factoryItf.encodeFunctionData("getPair",[fromToken,contract[primeRoute[1]][chainId]])
    });
    arrStore.push({ 
        target: factory, 
        callData: factoryItf.encodeFunctionData("getPair",[contract[primeRoute[1]][chainId],toToken])
    });

    // prime two
    arrStore.push({ 
        target: factory, 
        callData: factoryItf.encodeFunctionData("getPair",[fromToken,contract[primeRoute[2]][chainId]])
    });
    arrStore.push({ 
        target: factory, 
        callData: factoryItf.encodeFunctionData("getPair",[contract[primeRoute[2]][chainId],toToken])
    });

    return arrStore;
}














export const threeRoute = (factory,native,chainId,fromToken,toToken) => {
    const data = { 
        target: factory, 
        callData: factoryItf.encodeFunctionData("getPair",[fromToken,toToken])
    }

    return [data];
}




export const decodePairResult = (args) => {
    return factoryItf.decodeFunctionResult("getPair", args);
}

export const getChainDetails = (args) => {
    if(args == "eth") {
        return ({
            chainId: 1,
            defaultDex: "uniswap",
            nativeCoin: "weth"
        });
    } else if(args == "bnb") {
        return ({
            chainId: 56,
            defaultDex: "pancake",
            nativeCoin: "wbnb"
        });
    } else if(args == matic) {
        return ({
            chainId: 137,
            defaultDex: "",
            nativeCoin: "wmatic"
        });
    }
}