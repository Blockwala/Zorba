var helper = {}; // define a helper object

const Web3 = require('web3'); // Importing web3 
// web3 interacts with solidity

const fs = require('fs'); // to work with filesystems

const config = require('config');
// config organizes hierarchical configurations for your app deployments

 // solidity compiler, will be useful for deploying contracts using nodejs
// const solc = require('solc');

//Initiating web3
// Connect to test-RPC network
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider(config.get('node_address')));
}

var web3Socket = new Web3(new Web3.providers.WebsocketProvider(config.get('node_socket_address')));

//FUNCTIONS:---->



/***
* 
* @Aim:
* gets the Ethereum balance of the address
* 
* @Params:
* address params required
*
* @Returns:
* Promise[] 
*
***/

helper.getBalance = function(address) {
    return web3.eth.getBalance(address);
}

//get web3 provider: metamask , local or Mist
helper.getCurrentProvider = function() {
    return web3.currentProvider;
}

/**
 * @Aim:
 * Return an instance of UserTokenSale
 * 
 * @Params:
 * No params required
 * 
 * @Returns:
 * A pointer to that contract compiled into JSON
 */
helper.getTokenSale = () => {
    if (!userTokenSale) {
        userTokenSale = new web3.eth.Contract(userTokenSaleAbi, userTokenSaleAddress);
        userTokenSaleSocket = new web3Socket.eth.Contract(userTokenSaleAbi, userTokenSaleAddress);
        helper.subscribeToEvents(userTokenSaleSocket);
    }
    return userTokenSale;
}

helper.subscribeToEvents = (contract) => {
    // subscribe to the events here
}

/**
 * @Aim:
 * Returns the current gas price oracle. 
 * The gas price is determined by the last few blocks median gas price.
 * 
 * @Returns:
 * default gas price in wei
 */
helper.getGasPrice = () => {
    return web3.eth.getGasPrice()
        .then((gasprice) => {
            return gasprice;
        });
};

/**
 * @Aim :
 * From an array of accounts the node controls,
 * get account at a particular index
 * 
 * @Logic:
 * web3.eth.getAccounts returns the array of accounts
 * the node controls
 * 
 * @Params :
 * _index : index at which you want account
 */
helper.getAccountAtIndex = (_index) => {
    return web3.eth.getAccounts()
        .then((account) => {
            return account[index];
        })
}

/**
 * @Aim:
 * To check if the connection exists
 * 
 * @Returns:
 * the current httpProvider
 * if the current provider doesn't exist,
 * it returns null 
 */
helper.checkIsConnected = () => {
    web3.eth.getAccounts()
        .then(console.log);
    return web3.currentProvider;
}

/**
 * @Aim:
 * Signs the given transaction with the given private key
 * 
 * @Params:
 * _tx : a transaction object,
 * contains gas, to, value(in wei), data etc.
 * _privateKey : the private key using which it will be signed
 * 
 * @Returns: Object containing:
 * Hash of the message, 
 * Signature,
 * RLP encoded transaction, ready to be send using sendSignedTransaction method
 */
helper.createTx = (_tx, _privateKey) => {
    return web3.eth.accounts.signTransaction(_tx, _privateKey);
    //slottery signAccounts method used, method not found in documentatiuon
}

/**
 * @Aim:
 * Sends a signed transaction using signTransaction method
 * 
 * @Params:
 * _rawTx: a string, basically contains signed transaction data in HEX format
 * 
 * @Returns:
 * a promise combined event emitter,
 * which will be resolved when transaction receipt is available
 */
helper.sendTx = (rawTx) => {
    return web3.eth.sendSignedTransaction(rawTx);
}

/**
 * @Aim:
 * Sends the signed transaction to be mined n the blockchain
 * 
 * @Params:
 * _hashedTx: the signed Tx
 * successEvent: to be run on the success of sending tx
 * failureEvent: if sending of the tx fails
 * 
 * @Logs:
 * 1. Who is transaction sent to 
 * 2. Confirmation number of tx, when confirmed by vlocks
 * 3. Tx hash on sending of tx
 * 4. receipt of tx, when tx is mined on the block
 * 5. error, if there, in sending of the tx
 * 
 * @Events:
 * triggers given success and failure events 
 */
helper.makeSendSignedTx = (_hashedTx, successEvent, failureEvent) => {
    var tran  = helper.sendTx(_hashedTx);

    tran.on('confirmation', (confirmationNumber, receipt) => {
        console.log('confirmation: ' + confirmationNumber);
    });

    tran.on('transactionHash', hash => {
        console.log('hash');
        console.log(hash);
        successEvent(hash);
    });

    tran.on('receipt', receipt => {
        console.log('receipt');
        console.log(receipt);
    });

    tran.on('error', error => {
        console.log(error.toString());
        failureEvent(error);
    });
}

/**
 * @Aim:
 * 1. Signs transaction with the given private key 
 * 2. Sends the signed transaction
 * 3. Handles unsuccessful transactions with error
 * 
 * @Params:
 * 1. _tx : transaction object
 * 2. _private key
 * 3. _successEvent and _failureEvent to be triggered on
 *      tx being sent or sending failed respectively
 */
helper.makeSendTx = (_tx, _privateKey, successEvent, failureEvent) => {
    return helper.createTx(_tx, _privateKey)
        .then((signed) => {
            console.log("signed ", signed.toString());
            return makeSendSignedTx(signed, successEvent, failureEvent);

        });
}


module.exports = helper;