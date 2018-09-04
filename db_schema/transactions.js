/* { 
  blockHash: '0x96f5c86406ae01a111344359179530729a3d218881a1b9e2759a2ebee86f0d8a',
  blockNumber: 6241478,
  chainId: '0x1',
  condition: null,
  creates: null,
  from: '0x07b54aD68DAfd8eEf05262ABFdB5bF8EC2248813',
  gas: 21000,
  gasPrice: '44000000000',
  hash: '0xaba556f8abf7473dc31556c6530a5783a6138bbd4474a70f843f91d8efcf9c6d',
  input: '0x',
  nonce: 5,
  publicKey: '0xe4932ee547e8ab5c63e8e06802b0d7d125912e83f1e819599ec460fe81be5376bfbf9275ca8c2e34953c4bb810aa400f681ca22487098b1d517ef83842b88b5c',
  r: '0xddb39d78bc9e3ece329143af5e2d3aa3850f066036ac5534832278824a16324b',
  raw: '0xf86b05850a3e9ab80082520894a6f90dbe439f702a1c98fe38ba546e6988253f9d870262ac1262eb0c8025a0ddb39d78bc9e3ece329143af5e2d3aa3850f066036ac5534832278824a16324ba03ad31d32aab9609a09b6912e00257488935ff04718176ea13854f150caa7214b',
  s: '0x3ad31d32aab9609a09b6912e00257488935ff04718176ea13854f150caa7214b',
  standardV: '0x0',
  to: '0xA6f90Dbe439F702a1c98fE38bA546E6988253F9d',
  transactionIndex: 6,
  v: '0x25',
  value: '671441135790860' } */


var mongoose = require('mongoose');

var transactions = mongoose.Schema({
    blockHash: String,
    blockNumber: Number,
    hash: String,
    transactionIndex: Number,
    from: String,
    to: String,
    gas: Number,
    gasPrice: Number,
    value: String, //convert to int and devide by 8 after getting
    timestamp: Number
});

//todo create indexes

module.exports = transactions;

