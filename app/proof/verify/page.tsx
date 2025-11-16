"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Shield, AlertCircle } from 'lucide-react';

export default function VerifyProofPage() {
  const [proofJSON, setProofJSON] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);

  const hashData = async (data: string | null): Promise<string> => {
    const encoder = new TextEncoder();
    const text = data ? String(data).toLowerCase().trim() : '';
    const dataBuffer = encoder.encode(text);
    // @ts-ignore - crypto.subtle.digest accepts Uint8Array in browsers
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const verifyHash = async (value: string, secret: string, expectedHash: string): Promise<boolean> => {
    // Hash should be: SHA256(value.toLowerCase().trim())
    // Note: The secret is not used in the hash, it's just for verification purposes
    const computedHash = await hashData(value);
    return computedHash === expectedHash;
  };

  const verifyProof = async () => {
    if (!proofJSON.trim()) {
      setResult({ valid: false, error: 'Please paste the proof JSON' });
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      // Parse JSON
      let proof;
      try {
        proof = JSON.parse(proofJSON);
      } catch (err) {
        setResult({ valid: false, error: 'Invalid JSON format' });
        setVerifying(false);
        return;
      }

      // Check if it's a single field or full proof
      const isSingleField = proof.field && proof.value && proof.hash && !proof.fields;
      
      if (isSingleField) {
        // Verify single field
        if (!proof.field || !proof.value || !proof.hash) {
          setResult({ valid: false, error: 'Invalid field structure. Missing field, value, or hash.' });
          setVerifying(false);
          return;
        }

        // Require recordId for individual field verification
        if (!proof.recordId) {
          setResult({ valid: false, error: 'recordId is required for individual field verification. Please include the recordId in your JSON.' });
          setVerifying(false);
          return;
        }

        // Verify field via backend API (handles both hash and blockchain verification)
        let verificationResult: any = null;
        let verificationError = null;

        try {
          const response = await fetch('/api/proof/verify-field', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              field: proof.field,
              value: proof.value,
              hash: proof.hash,
              recordId: proof.recordId || null,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            verificationError = errorData.error || `Verification failed (${response.status})`;
          } else {
            verificationResult = await response.json();
          }
        } catch (err: any) {
          verificationError = `Failed to verify: ${err.message || 'Network error'}`;
        }

        if (verificationError) {
          setResult({
            valid: false,
            isSingleField: true,
            field: proof.field,
            value: proof.value,
            hash: proof.hash,
            hashValid: false,
            recordId: proof.recordId || null,
            blockchainValid: false,
            blockchainError: verificationError,
          });
        } else {
          setResult({
            valid: verificationResult.hashValid && (verificationResult.blockchainValid !== false),
            isSingleField: true,
            field: proof.field,
            value: proof.value,
            hash: proof.hash,
            hashValid: verificationResult.hashValid,
            recordId: proof.recordId || null,
            blockchainValid: verificationResult.blockchainValid,
            blockchainError: verificationResult.error || null,
            blockchainHash: verificationResult.blockchainHash || null,
          });
        }
      } else {
        // Full proof verification
        // Validate structure
        if (!proof.recordId || !proof.fields || !Array.isArray(proof.fields)) {
          setResult({ valid: false, error: 'Invalid proof structure. Missing recordId or fields. For single field, provide: {"field": "...", "value": "...", "hash": "...", "secret": "...", "recordId": "..."}' });
          setVerifying(false);
          return;
        }

        // Verify each field's hash locally
        const fieldResults: any[] = [];
        let allFieldsValid = true;

        for (const field of proof.fields) {
          if (!field.field || !field.value || !field.hash) {
            fieldResults.push({
              field: field.field || 'unknown',
              valid: false,
              error: 'Missing required field data',
            });
            allFieldsValid = false;
            continue;
          }

          const isValid = await verifyHash(field.value, field.secret || '', field.hash);
          fieldResults.push({
            field: field.field,
            value: field.value,
            hash: field.hash,
            valid: isValid,
          });

          if (!isValid) {
            allFieldsValid = false;
          }
        }

        // Verify on blockchain via API (using Next.js proxy to avoid CORS)
        let blockchainValid = false;
        let blockchainData = null;
        let blockchainError = null;

        try {
          const response = await fetch(`/api/proof/verify-record?recordId=${proof.recordId}`);
          if (response.ok) {
            blockchainData = await response.json();
            
            // Verify hashes match blockchain
            const blockchainHashes = {
              name: blockchainData.name_hash,
              student_id: blockchainData.student_id_hash,
              university: blockchainData.university_hash,
              expiration_date: blockchainData.expiration_date_hash,
            };

            let blockchainMatch = true;
            for (const field of proof.fields) {
              const blockchainHash = blockchainHashes[field.field as keyof typeof blockchainHashes];
              if (blockchainHash && blockchainHash !== field.hash) {
                blockchainMatch = false;
                break;
              }
            }
            
            blockchainValid = blockchainMatch;
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            blockchainError = errorData.error || `Record not found on blockchain (${response.status})`;
          }
        } catch (err: any) {
          blockchainError = `Failed to verify on blockchain: ${err.message || 'Network error'}`;
        }

        setResult({
          valid: allFieldsValid && blockchainValid,
          isSingleField: false,
          recordId: proof.recordId,
          fieldResults,
          blockchainValid,
          blockchainData,
          blockchainError,
        });
      }
    } catch (err: any) {
      setResult({ valid: false, error: err.message || 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            <span className="text-blue-500 dark:text-cyan-400">Verify</span>{' '}
            <span>Proof</span>
          </h1>
          <p className="text-muted-foreground">
            Paste your proof JSON to verify it's legitimate and stored on the blockchain
          </p>
        </div>

        {/* Input Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Proof JSON
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder='Paste your proof JSON here...\n\nFor full proof:\n{"recordId": 123, "fields": [{"field": "name", "value": "...", "secret": "...", "hash": "..."}]}\n\nFor single field:\n{"field": "name", "value": "...", "secret": "...", "hash": "...", "recordId": 123}'
              value={proofJSON}
              onChange={(e) => setProofJSON(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <Button
              onClick={verifyProof}
              disabled={verifying || !proofJSON.trim()}
              className="w-full"
              size="lg"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Proof
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className={`border-2 ${result.valid ? 'border-green-500' : 'border-red-500'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.valid ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-green-500">
                      {result.isSingleField ? 'Field Verified' : 'Proof Verified'}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-500">
                      {result.isSingleField ? 'Field Invalid' : 'Proof Invalid'}
                    </span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.error ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-900 dark:text-red-100">{result.error}</p>
                </div>
              ) : result.isSingleField ? (
                <>
                  {/* Single Field Verification */}
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Field: </span>
                      <Badge variant="outline" className="capitalize ml-2">
                        {result.field}
                      </Badge>
                    </div>
                    
                    {result.value && (
                      <div>
                        <span className="font-medium">Value: </span>
                        <span className="font-mono text-sm">{result.value}</span>
                      </div>
                    )}

                    {result.hash && (
                      <div>
                        <span className="font-medium">Hash: </span>
                        <span className="font-mono text-xs break-all">{result.hash}</span>
                      </div>
                    )}

                    {result.recordId && (
                      <div>
                        <span className="font-medium">Record ID: </span>
                        <span className="font-mono text-sm">{result.recordId}</span>
                      </div>
                    )}

                    {/* Hash Verification */}
                    <div className="space-y-2">
                      <h3 className="font-semibold">Hash Verification:</h3>
                      {result.hashValid ? (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <p className="text-sm text-green-900 dark:text-green-100">
                              Hash is valid!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <p className="text-sm text-red-900 dark:text-red-100">
                              Hash does not match the value
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Blockchain Verification (if recordId provided) */}
                    {result.recordId && (
                      <div className="space-y-2">
                        <h3 className="font-semibold">Blockchain Verification:</h3>
                        {result.blockchainError ? (
                          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                                {result.blockchainError}
                              </p>
                            </div>
                          </div>
                        ) : result.blockchainValid === true ? (
                          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <p className="text-sm text-green-900 dark:text-green-100">
                                Field hash matches blockchain record!
                              </p>
                            </div>
                          </div>
                        ) : result.blockchainValid === false ? (
                          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <p className="text-sm text-red-900 dark:text-red-100">
                                Hash does not match blockchain record
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Full Proof Verification */}
                  {result.recordId && (
                    <div>
                      <span className="font-medium">Record ID: </span>
                      <span className="font-mono text-sm">{result.recordId}</span>
                    </div>
                  )}

                  {/* Field Results */}
                  {result.fieldResults && result.fieldResults.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Field Verification:</h3>
                      {result.fieldResults.map((field: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border-2 ${
                            field.valid
                              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="capitalize">
                              {field.field}
                            </Badge>
                            {field.valid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          {field.value && (
                            <div className="text-sm">
                              <span className="font-medium">Value: </span>
                              <span className="font-mono">{field.value}</span>
                            </div>
                          )}
                          {field.error && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              {field.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Blockchain Verification */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Blockchain Verification:</h3>
                    {result.blockchainError ? (
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <p className="text-sm text-yellow-900 dark:text-yellow-100">
                            {result.blockchainError}
                          </p>
                        </div>
                      </div>
                    ) : result.blockchainValid ? (
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <p className="text-sm text-green-900 dark:text-green-100">
                            Record found on blockchain and hashes match!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <p className="text-sm text-red-900 dark:text-red-100">
                            Hashes do not match blockchain record
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

