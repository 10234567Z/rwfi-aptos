import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { retrieveFromIPFS, getIPFSUrl } from "@/utils/ipfsService";

interface IPFSDocumentViewerProps {
  documentHash: string;
  documentName: string;
}

export function IPFSDocumentViewer({ documentHash, documentName }: IPFSDocumentViewerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const extractCIDFromHash = (hash: string): string => {
    // Remove ipfs:// prefix if present
    return hash.startsWith('ipfs://') ? hash.substring(7) : hash;
  };

  const viewDocument = async () => {
    try {
      setLoading(true);
      const cid = extractCIDFromHash(documentHash);
      
      // Get IPFS gateway URL
      const url = await getIPFSUrl(cid);
      setFileUrl(url);
      
      // Open in new tab
      window.open(url, '_blank');
      
      toast({
        title: "Document Opened",
        description: "Document opened in new tab via IPFS gateway",
      });
    } catch (error) {
      toast({
        title: "Failed to Open Document",
        description: error instanceof Error ? error.message : "Failed to retrieve document from IPFS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async () => {
    try {
      setLoading(true);
      const cid = extractCIDFromHash(documentHash);
      
      // Retrieve file from IPFS
      const fileData = await retrieveFromIPFS(cid);
      
      // Create blob and download link
      const blob = new Blob([new Uint8Array(fileData)]);
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName || `document_${cid.substring(0, 8)}.bin`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
      toast({
        title: "Document Downloaded",
        description: "Document successfully downloaded from IPFS",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download document from IPFS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyIPFSLink = async () => {
    try {
      const cid = extractCIDFromHash(documentHash);
      const url = await getIPFSUrl(cid);
      
      await navigator.clipboard.writeText(url);
      
      toast({
        title: "Link Copied",
        description: "IPFS gateway link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to Copy",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">{documentName}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
            {extractCIDFromHash(documentHash).substring(0, 20)}...
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={viewDocument}
            disabled={loading}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            {loading ? "Loading..." : "View"}
          </Button>
          <Button
            onClick={downloadDocument}
            disabled={loading}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            Download
          </Button>
          <Button
            onClick={copyIPFSLink}
            size="sm"
            variant="ghost"
            className="text-xs"
            title="Copy IPFS link"
          >
            📋
          </Button>
        </div>
      </div>
      
      {fileUrl && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>IPFS URL:</strong>{" "}
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              {fileUrl}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
