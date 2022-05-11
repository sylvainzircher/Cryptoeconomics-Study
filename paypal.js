const EthCrypto = require('eth-crypto');
const Client = require('./client.js');

// Our naive implementation of a centralized payment processor
class Paypal extends Client {
  constructor() {
    super();
    // the state of the network (accounts and balances)
    this.state = {
      [this.wallet.address]: {
        balance: 1000000,
      },
    };
    // the history of transactions
    this.txHistory = [];
  }

  // Checks that the sender of a transaction is the same as the signer
  checkTxSignature(tx) {
    // Verifies that the signature is correct
    const signature = this.verify(tx.sig, this.toHash(tx.contents), tx.contents.from);
    // if the signature is invalid print an error to the console and return false
    if( signature == false ) {
      console.log("Invalid Signature");
      return false;
    }
    // return true if the transaction is valid
    return true;
  }

  // Checks if the user's address is already in the state, and if not, adds the user's address to the state
  checkUserAddress(tx) {
    // check if the sender is in the state
    let sender = tx.contents.from;
    let exists = sender in this.state;
    // if the sender is not in the state, create an account for them
    if (!exists) { 
      this.state[sender] = { balance: 0 };
    }
    // check if the receiver is in the state
    let receiver = tx.contents.to;
    exists = receiver in this.state;
    // if the receiver is not in the state, create an account for them
    console.log(exists);
    if (!exists) {
      this.state[receiver] = { balance: 0 };
    }
    // once the checks on both accounts pass (they're both in the state), return true
    return true;
  }

  // Checks the transaction type and ensures that the transaction is valid based on that type
  checkTxType(tx) {
    // if the transaction type is 'mint'
    if (tx.contents.type === "mint") {
    // check that the sender is PayPal
      let check = tx.contents.from === this.wallet.address;
    // if the check fails, print an error to the concole stating why and return false so that the transaction is not processed
      if (!check) { 
        console.log("Non-Paypal Clients can't mint!");
        return false;
      }
    // if the check passes, return true
      return true;
    }
    // if the transaction type is 'check'
    if (tx.contents.type === 'check') {
    // print the balance of the sender to the console
      console.log(`Your balance is: ${this.state[tx.contents.from].balance}`);
    // return false so that the stateTransitionFunction does not process the tx
      return false;
    }
    // if the transaction type is 'send'
    if (tx.contents.type === 'send') {
    // check that the transaction amount is positive and the sender has an account balance greater than or equal to the transaction amount
    // if a check fails, print an error to the console stating why and return false
    // if the check passes, return true
    // TODO    
      if (tx.contents.amount > 0 && this.state[tx.contents.from].balance >= tx.contents.amount) {
        return true;
      } else {
        console.log("Not enough fund");
        return false;
      }
    }
  }

  // Checks if a transaction is valid, adds it to the transaction history, and updates the state of accounts and balances
  checkTx(tx) {
    // check that the transaction signature is valid
    if (this.checkTxSignature(tx) === true) {
    // check that the transaction sender and receiver are in the state
      if(this.checkUserAddress(tx) === true) {
    // check that the transaction type is valid
        if(this.checkTxType(tx) === true) {
    // if all checks pass return true
          return true;
    // if any checks fail return false
        }
      }
    }
    return false;
  }

  // Updates account balances according to a transaction and adds the transaction to the history
  applyTx(tx) {
    // decrease the balance of the transaction sender/signer
    this.state[tx.contents.from].balance -= tx.contents.amount;
    // increase the balance of the transaction receiver
    this.state[tx.contents.to].balance += tx.contents.amount;
    // add the transaction to the transaction history
    this.txHistory.push(tx);
    // return true once the transaction is processed
    return tx;
  }

  // Process a transaction
  processTx(tx) {
    // check the transaction is valid
    if (this.checkTx(tx)) {
    // apply the transaction to Paypal's state
      this.applyTx(tx);
    }
  }
}

module.exports = Paypal;
