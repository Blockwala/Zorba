var address = {};

var Promise = require("bluebird");
var web3_helper = require('../../helper/web3-helper.js');
var config = require('config');
var erc20Txdb = require('../../dba/erc20Txdb.js')
var _ = require('lodash');

/**

Get ERC20 Balance

**/
address.getContractBalance = function(req, res) {

	var userAddress = req.params.user_address;
	var contractAddress = req.params.contract_address;

	web3_helper
		.getERC20Contract(contractAddress)
    .methods
		.balanceOf(userAddress)
		.call(function(error, result) {
      if(error || !result) {
       res.status(500).send(JSON.stringify({"error": errorMessage}));
       return;
      }
      response = { "balance": result }
      res.status(200).send(JSON.stringify(response));
    });
}


/**

Get ERC20 Token Name

**/
address.getNameOfCoin = function(req, res) {

  var userAddress = req.params.user_address;
  var contractAddress = req.params.contract_address;

  web3_helper
    .getERC20Contract(contractAddress)
    .methods
    .name()
    .call(function(error, result) {
      if(error || !result) {
       res.status(500).send(JSON.stringify({"error": errorMessage}));
       return;
      }
      response = { "name": result }
      res.status(200).send(JSON.stringify(response));
    });
}



/**

Get ERC20 Token Ticker

**/
address.getTickerOfCoin = function(req, res) {

  var userAddress = req.params.user_address;
  var contractAddress = req.params.contract_address;

  web3_helper
    .getERC20Contract(contractAddress)
    .methods
    .symbol()
    .call(function(error, result) {
      if(error || !result) {
        res.status(500).send(JSON.stringify({"error": errorMessage}));
        return;
      }
      response = { "ticker": result }
      res.status(200).send(JSON.stringify(response));
    });
}



/**

Get ERC20 Token Decimal

**/
address.getDecimalOfCoin = function(req, res) {

  var userAddress = req.params.user_address;
  var contractAddress = req.params.contract_address;

  web3_helper
    .getERC20Contract(contractAddress)
    .methods
    .decimals()
    .call(function(error, result) {
      if(error || !result) {
       res.status(500).send(JSON.stringify({"error": errorMessage}));
       return;
      }
      response = { "decimal": result }
      res.status(200).send(JSON.stringify(response));
    });
}




/**

Get ERC20 Transaction details

**/
address.getTransactionsFromContractForUser = function(req, res) {

var userAddress = req.params.user_address;
var contractAddress = req.params.contract_address;
// var requiredFields = ['returnValues', 'blockHash', 'blockNumber', 'transactionHash', 'symbol', 'address'];
var requiredFields = 'returnValues blockHash blockNumber transactionHash symbol address timestamp';


erc20Txdb.findOne(contractAddress, userAddress, requiredFields)
  .then(function(response) {
    res.status(200).send(response);
  })
  .catch(function(error) {
    res.status(500).send(error);
  });

}


address.getAccount = function(req, res) {
  var userAddress = req.query.user_address;
  var contractAddress = req.query.contract_address;

  if(userAddress == undefined || contractAddress == undefined) {
      res.status(500).send({"error": "Missing param"});
      return;
  }

  var requiredFields = 'returnValues blockHash blockNumber transactionHash symbol address timestamp';

  web3_helper
    .getERC20Contract(contractAddress)
    .methods
    .balanceOf(userAddress)
    .call(function(error, result) {
      var balance = result; 

      if(error || !result) {
       res.status(500).send(JSON.stringify({"error": errorMessage}));
      }

      erc20Txdb.findOne(contractAddress, userAddress, requiredFields)
        .then(function(erc20Txs) {

          var transactions = erc20Txs;

          _.forEach(transactions, function(transaction) {
            transaction = address.convertERC20TxtoEthLikeTx(transaction);
          })

          var response = {"balance": balance, "transactions": transactions, 'address': userAddress}

          res.status(200).send(response);

        })
        .catch(function(error) {
          console.log(error)
          res.status(500).send(error);
        });
    });
}

address.convertERC20TxtoEthLikeTx = function(tx) {
  tx['from'] = tx['returnValues']['from']
  tx['to'] = tx['returnValues']['to']
  tx['value'] = tx['returnValues']['value']
  tx['returnValues'] = null;
  return tx
}



module.exports = address;