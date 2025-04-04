import React, { useState } from 'react';
import { Button } from '@/components/ui/button'; 
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label'; 
import { Textarea } from '@/components/ui/textarea'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Define the schema for the form using Zod
const disasterFormSchema = z.object({
    disasterType: z.string().min(1, { message: 'Disaster type is required' }),
    location: z.string().min(1, { message: 'Location is required' }),
});

// Define the DisasterForm component
const DisasterForm = ({ contract }) => { 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);

    // Initialize the form using useForm
    const form = useForm<z.infer<typeof disasterFormSchema>>({
        resolver: zodResolver(disasterFormSchema),
        defaultValues: {
            disasterType: '',
            location: '',
        },
    });

    // Function to handle form submission
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setSubmissionError(null);
        setSubmissionSuccess(false);

        if (!contract) {
            setSubmissionError('Contract is not initialized.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Call the reportDisaster function on the smart contract
            const tx = await contract.reportDisaster(data.disasterType, data.location);
            console.log('Transaction Hash:', tx.hash);

            // Wait for the transaction to be confirmed
            await tx.wait();
            console.log('Disaster reported successfully!');
            setSubmissionSuccess(true);
            // Reset the form
            form.reset();

        } catch (error) {
            setSubmissionError(error.message || 'An error occurred while reporting the disaster.');
            console.error('Error reporting disaster:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="bg-gray-800/80 backdrop-blur-md shadow-lg border border-gray-700">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-gray-200">Report a Disaster</CardTitle>
                <CardDescription className="text-gray-400">
                    Report a disaster to request verification and potential fund allocation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="disasterType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300">Disaster Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                                                <SelectValue placeholder="Select a disaster type" className="text-gray-400" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-gray-800 border-gray-700">
                                            <SelectItem value="Hurricane" className="hover:bg-gray-700 text-white">Hurricane</SelectItem>
                                            <SelectItem value="Earthquake" className="hover:bg-gray-700 text-white">Earthquake</SelectItem>
                                            <SelectItem value="Flood" className="hover:bg-gray-700 text-white">Flood</SelectItem>
                                            <SelectItem value="Wildfire" className="hover:bg-gray-700 text-white">Wildfire</SelectItem>
                                            <SelectItem value="Tornado" className="hover:bg-gray-700 text-white">Tornado</SelectItem>
                                            <SelectItem value="Other" className="hover:bg-gray-700 text-white">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300">Location</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter the disaster location"
                                            className="bg-gray-700 text-white border-gray-600 placeholder:text-gray-400"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={cn(
                                "w-full bg-blue-500 text-white hover:bg-blue-600",
                                isSubmitting && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </Button>

                        {submissionError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{submissionError}</AlertDescription>
                            </Alert>
                        )}
                        {submissionSuccess && (
                            <Alert className="bg-green-600/90 text-white border-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>
                                    Disaster reported successfully!  Your report will be reviewed.
                                </AlertDescription>
                            </Alert>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default DisasterForm;
