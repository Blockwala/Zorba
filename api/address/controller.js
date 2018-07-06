var address = {};

var Promise = require("bluebird");
var web3_helper = require('../../helper/web3-helper.js');
var config = require('config');

address.getBalance = function(req, res) {
	var address_from_api = req.params.address;

	console.log(address_from_api)

	web3_helper.getBalance(address_from_api)
		.then(function(response) {
			res.status(200).send({message: JSON.stringify(response)});
		})
		.catch(function(error) {
			console.log(JSON.stringify(error))
 			res.status(500).send({message: JSON.stringify(error)});
		});
}



module.exports = address;