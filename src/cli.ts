'use strict';

import { Core } from './core';
import { BADFLAGS } from 'dns';

const core = Core();
// core.conDB.connect(function (error: any) {
//     if (error) {
//         console.log('error\t', error);
//     } else {
//         console.log("connected");
//     }
// })


async function checkToken(tokenContract: any, tokenName: any, from: number | string, to: number | string) {
    let logs;
    // console.log('from  ' + from + ': to: ' + to);
    try {
        logs = await core.getPastTransferEvents(tokenContract, from, to);
        console.log('from  ' + from + ': to: ' + to);
    } catch (error) {
        var err = tokenName + ": get past event error: " + "from: " + from + " to: " + to
        await core.Logger('./dataStorage/error.log', tokenName + ": get past event error: " + "from: " + from + " to: " + to)
        throw err + '\r' + error
    }
    // console.log("log info is", logs)
    let fromAdd: any
    let toAdd: any
    let value: any
    let blockNumber: any;
    let txHash: any;
    for (var i = 0; i < logs.length; i++) {
        var logResult = await checkTokenLog(logs[i])
        fromAdd = logResult[0];
        toAdd = logResult[1];
        value = logResult[2];
        blockNumber = logResult[3]; // block hash
        txHash = logResult[4];
        // value = value / Math.pow(10, 18);

        // let blockInfo
        // try {
        //     blockInfo = await core.getBlockInfo(blockNumber)
        // } catch (error) {
        //     await core.Logger('./dataStorage/error.log', tokenName + ": get block error, " + "blockNumber: " + blockNumber)
        //     throw error
        // }
        // let timestamp = blockInfo.timestamp

        var row = [fromAdd, toAdd, value, blockNumber, txHash]
        // console.log("blockNumber:", row[3])
        let r = await core.Insert_TOKENTABLE(tokenName, row)

        if (!r) {
            throw 'insert table error'
        }
    }

}


async function checkTokenLog(log: any): Promise<any> {
    var fromAdd: any;
    var toAdd: any;
    var value: any;
    var blockNumber: any;
    var txHash: any;
    // console.log("log[i] info is", logs[i].returnValues)
    if (typeof log.returnValues._from == 'undefined') {
        fromAdd = log.returnValues.from // address of from
        toAdd = log.returnValues.to     // address of to
        value = log.returnValues.value
    } else {
        fromAdd = log.returnValues._from // address of from
        toAdd = log.returnValues._to     // address of to
        value = log.returnValues._value
        if (typeof log.returnValues._value == 'undefined') {
            value = log.returnValues._amount
        }
    }
    blockNumber = log.blockNumber;
    txHash = log.transactionHash;
    return new Promise((resolve, reject) => {
        var result = [fromAdd, toAdd, value, blockNumber, txHash];
        resolve(result)
    });

}

export async function fetchData() {
    for (var i = 20; i < 30; i++) {
        await core.Insert_TOKENTABLE(core.tokenNameKey[i], ['sender', 'receiver', 'amount', 'blockNumber', 'txHash'])
        // await core.Logger('./dataStorage/'+core.tokenNameKey[i]+'.csv', ['sender', 'receiver', 'amount', 'blockNumber', 'txHash', 'timestamp'])
        for (var batch = 0; batch < 5910; batch++) {
            
            console.log("batch value: ", batch)
            var flag = true;
            var status;
            var j = 0;
            while(j < 20 && flag) { // Once error happens, keep retrying to pull token data up to 20 times.   
                try {
                    j++;
                    flag = false;
                    await checkToken(core.contractList[i], core.tokenNameKey[i], batch * (1000), (batch + 1) * 1000 - 1)
                } catch (err) {
                    flag = true;
                    await core.Logger('./dataStorage/error.log', 'fetch data error: ' + err)
                }
            }

        }

    }
}

fetchData()