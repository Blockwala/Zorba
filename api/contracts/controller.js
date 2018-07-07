var address = {};

var Promise = require("bluebird");
var web3_helper = require('../../helper/web3-helper.js');
var config = require('config');

/**

Get ERC20 Balance

**/
address.getContractBalance = function(req, res) {

	var address_from_api = req.params.address;

	web3_helper.getBalance(address_from_api)
		.then(function(balance) {
			response = { "balance": balance }
			res.status(200).send(response);
		})
		.catch(function(error) {
 			res.status(500).send({message: JSON.stringify(error)});
		});
}



module.exports = address;