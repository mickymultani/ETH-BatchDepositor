import React, { useState } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { parseEther } from '@ethersproject/units';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [signer, setSigner] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [keyValidation, setKeyValidation] = useState(null);

  const validateKeys = (data) => {
    const expectedSizes = [48, 32, 96];
    let validationResult = [];

    for (let item of data) {
        const actualByteSizePubkey = item.pubkey.length / 2;
        const actualByteSizeCredentials = item.withdrawal_credentials.length / 2;
        const actualByteSizeSignature = item.signature.length / 2;

        validationResult.push({
            pubkey: { valid: actualByteSizePubkey === expectedSizes[0], size: actualByteSizePubkey },
            withdrawal_credentials: { valid: actualByteSizeCredentials === expectedSizes[1], size: actualByteSizeCredentials },
            signature: { valid: actualByteSizeSignature === expectedSizes[2], size: actualByteSizeSignature }
        });
    }

    return validationResult;
};


  const onFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setFile(file);
  };

  const onContinue = async () => {
    if (!file) return alert('Please upload a file!');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const validationResult = validateKeys(data);
        setKeyValidation(validationResult);

        const nodesAmount = data.length;
        const totalAmount = (32 * nodesAmount); // Total amount in ETH
        const network = data[0]?.network_name || "unknown";

        setSummary({
          nodesAmount,
          totalAmount,
          network,
          contractAddress: "0x2cB1A746A8652dfbb0FC11BdA71Bd991EB2Fd52e",
          data
        });
        setCurrentStep(2);
      } catch (error) {
        console.error('Error reading file or parsing JSON', error);
        alert('Error reading uploaded file.');
      }
    };
    reader.readAsText(file);
  };

  const proceedToDeploy = () => {
    setCurrentStep(3);
  };

  const connectWalletAndDeploy = async () => {
    try {
      const signer = await connectWallet();
      if (!signer || !summary) return;
      setSigner(signer);
    } catch (err) {
      console.error(err);
      alert('Error connecting wallet.');
    }
  };

  const onDeploy = async () => {
    try {
      if (!signer || !summary) return alert('Please connect to wallet and review summary before deploying!');

      const contract = new Contract(summary.contractAddress, [{"inputs":[{"internalType":"bool","name":"mainnet","type":"bool"},{"internalType":"address","name":"depositContract_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"uint256","name":"nodesAmount","type":"uint256"}],"name":"DepositEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[],"name":"collateral","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"credentialsLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes[]","name":"pubkeys","type":"bytes[]"},{"internalType":"bytes[]","name":"withdrawal_credentials","type":"bytes[]"},{"internalType":"bytes[]","name":"signatures","type":"bytes[]"},{"internalType":"bytes32[]","name":"deposit_data_roots","type":"bytes32[]"}],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"depositContract","outputs":[{"internalType":"contract IDepositContract","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nodesMaxAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nodesMinAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pubkeyLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"signatureLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}], signer);
      
      const { data } = summary;
      const pubkeys = data.map(item => '0x' + item.pubkey);
      const withdrawal_credentials = data.map(item => '0x' + item.withdrawal_credentials);
      const signatures = data.map(item => '0x' + item.signature);
      const deposit_data_roots = data.map(item => '0x' + item.deposit_data_root);

      const nodesAmount = data.length;
      const amountInEther = 32 * nodesAmount;
      const correctAmount = parseEther(amountInEther.toString());

      const tx = await contract.deposit(pubkeys, withdrawal_credentials, signatures, deposit_data_roots, { value: correctAmount, gasLimit: 6000000 });
      
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      
      alert('Transaction successful!');
    } catch (err) {
      console.error(err);
      alert('Error deploying validators.');
    }
  };

  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      console.log("Wallet connected");
      return signer;
    } catch (err) {
      console.error("User rejected the connection request");
      alert('User rejected the connection request');
    }
  };

  const onPrev = () => setCurrentStep((prevStep) => prevStep - 1);

  return (
    <div className="App">
      <div className="container">
        {currentStep === 1 && (
          <div className="upload-section">
            <div className="title">Step 1: Upload Deposit Data</div>
          <p className="start">
      ⚠️ Please upload Deposit Data File generated on the Ethereum Launchpad website. The deposit-data-[timestamp].json is located in the /staking-deposit-cli/validator_keys folder.</p>
          <input id="file-upload" type="file" onChange={onFileUpload} className="file-input" />
          <button onClick={onContinue} className="btn continue-btn">Continue</button>
        </div>
        )}

        {currentStep === 2 && summary && (
          <div className="summary-section">
            <div className="title">Step 2: Review Details</div>
            <div className="validation-section">
              Key Validation Results:
              {keyValidation && keyValidation.map((result, index) => (
               <div key={index} className="key-validation-result">
                Node {index + 1}: 
                Pubkey Size: {result.pubkey.size} bytes ({result.pubkey.valid ? 'Valid' : 'Invalid'}),
                Withdrawal Credentials Size: {result.withdrawal_credentials.size} bytes ({result.withdrawal_credentials.valid ? 'Valid' : 'Invalid'}),
                Signature Size: {result.signature.size} bytes ({result.signature.valid ? 'Valid' : 'Invalid'})
                 </div>
                ))}

            </div>
            <div className="summary-info">
              <p>Nodes to be deployed: {summary.nodesAmount}</p>
              <p>Amount to be staked: {summary.totalAmount} ETH</p>
              <p>Network: {summary.network}</p>
              <p>Abyss Contract: {summary.contractAddress}</p>
            </div>
            <button onClick={connectWalletAndDeploy}>Connect Wallet</button>
            {signer && <button onClick={proceedToDeploy}>Proceed to Deploy</button>}
            <button onClick={onPrev}>Back</button>
          </div>
        )}

        {currentStep === 3 && signer && (
          <div className="deploy-section">
          <div className="title">Step 3: Confirm Batch Deposit</div>
          <p className="warning">
            ⚠️ You are about to initiate the transfer of <strong>{summary.totalAmount} ETH</strong> to the Abyss Finance contract.
            Please double-check the contract to ensure the contract address (<strong>{summary.contractAddress}</strong>) and the amount you are locking up are accurate when you see the transaction details in MetaMask.
          </p>
          <button onClick={onDeploy} className="btn deploy-btn">Deploy</button>
          <button onClick={onPrev} className="btn back-btn">Back</button>
        </div> 
        )}
      </div>
    </div>
  );
}

export default App;