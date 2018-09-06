var transactions = {};

var Promise = require("bluebird");
var web3_helper = require('../../helper/web3-helper.js');
var config = require('config');


transactions.getState = function(req, res) {
	web3_helper.getGasPrice()
		 .then((gasprice) => {
	            res.status(200).send({"gas_price": gasprice, "gas_limit": "21000"});
	        })
	        .catch((error) => {
	            res.status(500).send({"error": error});
	        });
}

module.exports = transactions;