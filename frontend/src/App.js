import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button'; 
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" 
import { AlertCircle } from "lucide-react"
import config from './config'; 
import DisasterForm from './components/DisasterForm';
import VerificationStatus from './components/VerificationStatus';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const App = () => {
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [networkName, setNetworkName] = useState<string>('');
    const [userAddress, setUserAddress] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [totalFunds, setTotalFunds] = useState<string>('');


    // Initialize Ethers.js provider and signer
    useEffect(() => {
        const init = async () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                try {
                    const ethersProvider = new ethers.BrowserProvider(window.ethereum);
                    setProvider(ethersProvider);

                    const ethersSigner = await ethersProvider.getSigner();
                    setSigner(ethersSigner);

                    // Get network information
                    const network = await ethersProvider.getNetwork();
                    setNetworkName(network.name);

                    setUserAddress(await ethersSigner.getAddress());

                    // Create contract instance
                    const emergencyFundContract = new ethers.Contract(config.contractAddress, config.contractAbi, ethersSigner);
                    setContract(emergencyFundContract);

                } catch (err) {
                    setError(`Error initializing: ${err.message || 'Unknown error'}`);
                    console.error("Initialization Error:", err)
                }
            } else {
                setError('Web3 provider (e.g., MetaMask) is required.');
                console.error("Web3 provider is required")
            }
        };
        init();
    }, []);

    // Function to fetch total funds
      const fetchTotalFunds = async () => {
        if (contract) {
          try {
            const funds = await contract.getTotalFunds();
            setTotalFunds(ethers.formatEther(funds));
          } catch (err) {
            setError(`Error fetching total funds: ${err.message || 'Unknown error'}`);
            console.error("Error fetching total funds", err);
          }
        }
      };

    useEffect(() => {
        fetchTotalFunds();
    }, [contract]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl sm:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Emergency Fund
                </h1>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {provider && signer && contract && (
                    <div className="space-y-6">
                        <div className="bg-gray-800/80 backdrop-blur-md p-4 sm:p-6 rounded-lg shadow-lg border border-gray-700">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-200">Network Information</h2>
                            <p className="text-gray-300">
                                You are connected to: <span className="font-medium text-blue-400">{networkName}</span>
                            </p>
                            <p className="text-gray-300">
                                Your Address: <span className="font-medium text-purple-400">{userAddress}</span>
                            </p>
                        </div>

                        <Card className="bg-gray-800/80 backdrop-blur-md border border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold text-gray-200">Total Funds</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xl text-green-400">{totalFunds} ETH</p>
                            </CardContent>
                        </Card>

                        <DisasterForm contract={contract} />

                        <VerificationStatus contract={contract} />

                    </div>
                )}

                {!provider && (
                    <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-lg shadow-lg border border-gray-700 text-center">
                        <p className="text-gray-300 mb-4">
                            Please connect your Web3 wallet (e.g., MetaMask) to use the Emergency Fund.
                        </p>
                        {typeof window !== 'undefined' && typeof window.ethereum === 'undefined' && (
                            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 border-blue-500/50">
                                    Download MetaMask
                                </Button>
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
