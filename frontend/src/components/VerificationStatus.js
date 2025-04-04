import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Assuming you're using shadcn/ui
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"

const VerificationStatus = ({ contract }) => { 
    const [userAddress, setUserAddress] = useState<string>('');
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputAddress, setInputAddress] = useState<string>('');

    // Function to fetch verification status
    const fetchVerificationStatus = async => {
        setLoading(true);
        setError(null);
        setIsVerified(null); // Reset to null when fetching for a new address

        if (!contract) {
            setError('Contract is not initialized.');
            setLoading(false);
            return;
        }

        try {
            const verificationStatus = contract.isVerified(address);
            setIsVerified(verificationStatus);
        } catch (err) {
            setError(err.message || 'Failed to fetch verification status.');
            console.error("Error fetching verification status", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const getAddress = async () => {
            if (contract) {
                try {
                    const signer = await contract.getSigner();
                    const address = await signer.getAddress();
                    setUserAddress(address);
                    setInputAddress(address); 
                    fetchVerificationStatus(address); 
                } catch (err) {
                    setError(err.message || "Failed to get user address");
                    console.error("Error getting user address", err)
                }
            }
        };
        getAddress();
    }, [contract]);

    const handleCheckStatus = () => {
        if (inputAddress) {
            fetchVerificationStatus(inputAddress);
        } else {
            setError("Please enter an address to check.")
        }
    }

    return (
        <Card className="bg-gray-800/80 backdrop-blur-md shadow-lg border border-gray-700">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-gray-200">Verification Status</CardTitle>
                <CardDescription className="text-gray-400">
                    Check the verification status of a disaster report.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="address" className="text-gray-300">Ethereum Address</Label>
                    <div className="flex gap-2">
                        <Input
                            id="address"
                            type="text"
                            value={inputAddress}
                            onChange={(e) => setInputAddress(e.target.value)}
                            placeholder="Enter Ethereum address"
                            className="bg-gray-700 text-white border-gray-600 placeholder:text-gray-400"
                        />
                        <Button
                            onClick={handleCheckStatus}
                            disabled={loading}
                            className={cn(
                                "bg-blue-500 text-white hover:bg-blue-600",
                                loading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                "Check Status"
                            )}
                        </Button>
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking verification status...
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        {error}
                    </div>
                )}
                {isVerified !== null && (
                    <div
                        className={cn(
                            "p-3 rounded-lg flex items-center gap-2",
                            isVerified
                                ? "bg-green-600/90 text-white border-green-700"
                                : "bg-red-600/90 text-white border-red-700"
                        )}
                    >
                        {isVerified ? (
                            <CheckCircle className="h-5 w-5" />
                        ) : (
                            <AlertTriangle className="h-5 w-5" />
                        )}
                        <span className="font-medium">
                            Verification Status: {isVerified ? 'Verified' : 'Not Verified'}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default VerificationStatus;

