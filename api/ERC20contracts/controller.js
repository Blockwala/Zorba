var address = {};

var Promise = require("bluebird");
var web3_helper = require('../../helper/web3-helper.js');
var config = require('config');

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
		.call(
           function(error, result) {
             if(error || !result) {
               res.status(500).send(JSON.stringify({"error": errorMessage}));
               return;
             }
               res.status(200).send(JSON.stringify(result));
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
    .call(
           function(error, result) {
             if(error || !result) {
               res.status(500).send(JSON.stringify({"error": errorMessage}));
               return;
             }
               res.status(200).send(JSON.stringify(result));
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
    .call(
           function(error, result) {
             if(error || !result) {
               res.status(500).send(JSON.stringify({"error": errorMessage}));
               return;
             }
               res.status(200).send(JSON.stringify(result));
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
    .call(
           function(error, result) {
             if(error || !result) {
               res.status(500).send(JSON.stringify({"error": errorMessage}));
               return;
             }
               res.status(200).send(JSON.stringify(result));
        });
}



module.exports = address;