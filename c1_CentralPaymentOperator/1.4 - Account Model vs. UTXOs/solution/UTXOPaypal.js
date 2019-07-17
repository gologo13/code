const EthCrypto = require('eth-crypto')
const Client = require('./Client.js')


class Paypal extends Client {
    constructor() {
        super()
        this.state = {}
    }

    applyTransaction(tx) {
        // Recover addresses for all signatures
        const signers = []
        for (let sig of tx.sigs) {
            signers.push(EthCrypto.recover(sig, this.toHash(tx.contents)))
        }
        let totalInputValue = 0
        // Check that all inputs are indeed unspent, and that we have the signature for the owner
        for (let inputIndex of tx.contents.inputs) {
            const input = this.state.txOutputs[inputIndex]
            if (!signers.includes(input.owner)) {
                throw new Error('Missing signature for: ' + input.owner)
            }
            if (this.state.isSpent[inputIndex]) {
                throw new Error('Trying to spend spent tx output!')
            }
            // Add to the total input value
            totalInputValue += input.value
        }
        let totalOutputValue = 0
        for (let output of tx.contents.outputs) {
            totalOutputValue += output.value
        }
        if (totalInputValue !== totalOutputValue) {
            throw new Error('Non-equal input and output values!')
        }
        // Update the state object!
        // First make the inputs spent
        for (let inputIndex of tx.contents.inputs) {
            this.state.isSpent[inputIndex] = 1
        }
        // Next append the outputs to our list of outputs and add a 0 to our list of utxos
        for (let output of tx.contents.outputs) {
            this.state.txOutputs.push(output)
            this.state.isSpent.push(0)
        }
    }
}

module.exports = Paypal;
