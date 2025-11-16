"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle2, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ViewProofsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewProofsModal({ open, onOpenChange }: ViewProofsModalProps) {
  const { toast } = useToast();
  const [proofData, setProofData] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Load proof store data from localStorage
      const stored = localStorage.getItem('proofStoreData');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setProofData(data);
        } catch (err) {
          console.error('Failed to parse proof store data:', err);
        }
      }
    }
  }, [open]);

  if (!proofData || !proofData.parsed || !proofData.secrets) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Proofs</DialogTitle>
            <DialogDescription>Your verification proofs</DialogDescription>
          </DialogHeader>
          <div className="p-6 text-center text-muted-foreground">
            <p>No proof data found. Please complete ID verification first.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const generateProofJSON = () => {
    const { parsed, secrets, hashes, recordId } = proofData;
    
    const proof = {
      recordId: recordId,
      fields: [
        {
          field: 'name',
          value: parsed.name || null,
          secret: secrets.nameSecret || null,
          hash: hashes?.name || null,
          recordId: recordId, // Include recordId in each field
        },
        {
          field: 'student_id',
          value: parsed.student_id || null,
          secret: secrets.studentIdSecret || null,
          hash: hashes?.student_id || null,
          recordId: recordId, // Include recordId in each field
        },
        {
          field: 'university',
          value: parsed.university || null,
          secret: secrets.universitySecret || null,
          hash: hashes?.university || null,
          recordId: recordId, // Include recordId in each field
        },
        {
          field: 'expiration_date',
          value: parsed.expiration_date || null,
          secret: secrets.expirationSecret || null,
          hash: hashes?.expiration_date || null,
          recordId: recordId, // Include recordId in each field
        },
      ].filter(f => f.value !== null), // Only include fields with values
    };

    return JSON.stringify(proof, null, 2);
  };

  const proofJSON = generateProofJSON();

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            View Proofs
          </DialogTitle>
          <DialogDescription>
            Your verification proofs. Copy the JSON below to verify on the proof verification page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Proof Fields */}
          <div className="grid grid-cols-1 gap-3">
            {proofData.parsed && Object.entries(proofData.parsed).map(([key, value]: [string, any]) => {
              if (!value) return null;
              const secret = proofData.secrets?.[`${key}Secret`] || proofData.secrets?.[`${key === 'student_id' ? 'studentId' : key}Secret`];
              const hash = proofData.hashes?.[key];
              
              return (
                <Card key={key} className="border-2">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">{key.replace('_', ' ')}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify({
                            field: key,
                            value,
                            secret,
                            hash,
                            recordId: proofData.recordId,
                          }, null, 2), key)}
                        >
                          {copied === key ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium text-muted-foreground">Value: </span>
                          <span className="font-mono text-xs">{String(value)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Secret: </span>
                          <span className="font-mono text-xs break-all">{secret || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Hash: </span>
                          <span className="font-mono text-xs break-all">{hash || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Full JSON */}
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Full Proof JSON</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(proofJSON, 'JSON')}
                >
                  {copied === 'JSON' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy JSON
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono">
                {proofJSON}
              </pre>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>How to verify:</strong> Copy the JSON above and paste it on the{' '}
                <a href="/proof/verify" className="underline font-medium">proof verification page</a> to verify
                that your proof is legitimate and stored on the blockchain.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

