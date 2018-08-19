
/*

Sample tx

{ address: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
    blockHash: '0x47e94b27fe6ecab485005151e070346f2eeb487aa4e308f5e1daa28c1b0c4337',
    blockNumber: 6168673,
    logIndex: 20,
    removed: false,
    transactionHash: '0x0ce8318b9fca0895baf7596a3a8042d4a6cb46a102227093c5a8926abb62c029',
    transactionIndex: 32,
    transactionLogIndex: '0x0',
    type: 'mined',
    id: 'log_893bdc62',
    returnValues:
     Result {
       '0': '0x6FE1d5AE5EA6BA334Bd4c1CC2DD8B6695314D82d',
       '1': '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
       '2': '4022000000000000000000',
       from: '0x6FE1d5AE5EA6BA334Bd4c1CC2DD8B6695314D82d',
       to: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
       value: '4022000000000000000000' },
    event: 'Transfer',
    signature: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    raw:
     { data: '0x0000000000000000000000000000000000000000000000da08766a87dd180000',
       topics: [Array] } }

*/


var mongoose = require('mongoose');

var erc20TransactionSchema = mongoose.Schema({
		symbol: String,
        address: String, //coin contract address
        blockHash: String,
        blockNumber: Number,
        transactionHash: String,
        transactionIndex: Number,
        from: String,
        to: String,
        value: String, //convert to int and devide by 8 after getting
        signature: String,
        event: String,
        entry_time: Date
});

//todo create indexes

module.exports.erc20TransactionSchema = erc20TransactionSchema;
