"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useKYC, useAdminKYC } from "@/hooks/useKYC";
import { KYC_LEVEL, KYC_STATUS, CONTRACT_ADDRESS, normalizeAddress } from "@/utils/aptosClient";
import { IPFSDocumentViewer } from "./IPFSDocumentViewer";

interface KYCApplication {
  address: string;
  level: number;
  status: number;
  documentHashes: string[];
  submittedAt: string;
  reviewedAt?: string;
}

export function AdminKYCDashboard() {
  const { account } = useWallet();
  const { toast } = useToast();
  const { getKYCStatusText, getKYCStatusColor } = useKYC();
  const { 
    getPendingKYCApplications, 
    getKYCStats, 
    processKYCApplication
  } = useAdminKYC();
  
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null);
  const [processingApplication, setProcessingApplication] = useState<string | null>(null);
  const [kycStats, setKycStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  // Admin access control
  const adminAddress = normalizeAddress(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || CONTRACT_ADDRESS);

  const isAdmin = normalizeAddress(account?.address?.toString()) === adminAddress;

  console.log("Admin Address:", process.env.NEXT_PUBLIC_CONTRACT_ADDRESS );
  // Load real KYC data from blockchain
  useEffect(() => {
    const loadKYCData = async () => {
      try {
        setLoading(true);
        console.log("Loading KYC data from blockchain...");
        
        // Get KYC statistics with safety checks
        const stats = await getKYCStats();
        console.log("KYC Stats:", stats);
        
        // Ensure stats is an object with the expected properties
        const safeStats = {
          total: typeof stats?.total === 'number' ? stats.total : 0,
          pending: typeof stats?.pending === 'number' ? stats.pending : 0,
          approved: typeof stats?.approved === 'number' ? stats.approved : 0,
          rejected: typeof stats?.rejected === 'number' ? stats.rejected : 0,
        };
        setKycStats(safeStats);
        
        // Get pending applications 
        const pendingApps = await getPendingKYCApplications();
        console.log("Pending Applications:", pendingApps);
        
        // If no data from blockchain, show message that data will appear when suppliers submit KYC
        if (!pendingApps || pendingApps.length === 0) {
          setApplications([]);
          toast({
            title: "No KYC Data",
            description: "No suppliers have submitted KYC yet. Data will appear when suppliers submit their documents.",
          });
        } else {
          // Convert blockchain data to component format with safety checks
          const formattedApps: KYCApplication[] = pendingApps.filter(app => app && app.supplier_address).map((app: any) => ({
            address: normalizeAddress(app.supplier_address || app.supplier_addr || ""),
            level: KYC_LEVEL.BASIC, // Default to basic for now
            status: app.approved ? KYC_STATUS.PENDING : KYC_STATUS.PENDING,
            documentHashes: Array.isArray(app.proof_hashes) ? app.proof_hashes.filter(Boolean) : [],
            submittedAt: app.submitted_at ? new Date(app.submitted_at * 1000).toISOString() : new Date().toISOString(),
            reviewedAt: app.reviewed_at && app.reviewed_at > 0 ? new Date(app.reviewed_at * 1000).toISOString() : undefined,
          }));
          
          console.log("Formatted Applications:", formattedApps);
          setApplications(formattedApps);
        }
        
      } catch (error) {
        console.error("Failed to load KYC data:", error);
        toast({
          title: "Failed to Load Data",
          description: "Could not load KYC applications from blockchain. Using demo data.",
          variant: "destructive",
        });
        
        // Fallback to mock data on error
        loadMockData();
      } finally {
        setLoading(false);
      }
    };

    loadKYCData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove function dependencies to prevent infinite loop

  // If not admin, show access denied
  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 text-lg">Please connect your wallet to access the admin dashboard</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="text-red-400 text-lg mb-2">Access Denied</div>
            <div className="text-gray-400">You are not authorized to access the admin dashboard</div>
            <div className="text-gray-500 text-sm mt-2">Connected: {account.address?.toString()}</div>
            <div className="text-gray-500 text-sm">Required: {adminAddress}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback mock data function
  const loadMockData = () => {
    const mockApplications: KYCApplication[] = [
      {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        level: KYC_LEVEL.BASIC,
        status: KYC_STATUS.PENDING,
        documentHashes: [
          "ipfs://QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
          "ipfs://QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx2"
        ],
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        address: "0xabcdef1234567890abcdef1234567890abcdef12",
        level: KYC_LEVEL.ENHANCED,
        status: KYC_STATUS.PENDING,
        documentHashes: [
          "ipfs://QmYyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy1",
          "ipfs://QmYyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy2",
          "ipfs://QmYyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy3",
          "ipfs://QmYyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy4"
        ],
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        address: "0x9876543210fedcba9876543210fedcba98765432",
        level: KYC_LEVEL.BASIC,
        status: KYC_STATUS.APPROVED,
        documentHashes: [
          "ipfs://QmZzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz1",
          "ipfs://QmZzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz2"
        ],
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
    
    setApplications(mockApplications);
    setKycStats({ total: 3, pending: 2, approved: 1, rejected: 0 });
  };

  // Refresh data from blockchain
  const refreshData = async () => {
    try {
      setLoading(true);
      
      const stats = await getKYCStats();
      setKycStats(stats);
      
      const pendingApps = await getPendingKYCApplications();
      const formattedApps: KYCApplication[] = (pendingApps || []).map((app: any) => ({
        address: normalizeAddress(app.supplier_address || app.supplier_addr || ""),
        level: KYC_LEVEL.BASIC,
        status: app.approved ? KYC_STATUS.APPROVED : KYC_STATUS.PENDING,
        documentHashes: Array.isArray(app.proof_hashes) ? app.proof_hashes.filter(Boolean) : [],
        submittedAt: app.submitted_at ? new Date(app.submitted_at * 1000).toISOString() : new Date().toISOString(),
        reviewedAt: app.reviewed_at > 0 ? new Date(app.reviewed_at * 1000).toISOString() : undefined,
      }));
      
      setApplications(formattedApps);
      
      toast({
        title: "Data Refreshed",
        description: "KYC data has been updated from the blockchain.",
      });
      
    } catch (error) {
      toast({
        title: "Refresh Failed", 
        description: "Could not refresh data from blockchain.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (application: KYCApplication, approved: boolean) => {
    try {
      setProcessingApplication(application.address);
      
      await processKYCApplication(
        application.address,
        approved
      );

      // Refresh data from blockchain after successful processing
      const stats = await getKYCStats();
      setKycStats(stats);
      
      // Remove the processed application from pending list
      setApplications(prev => prev.filter(app => app.address !== application.address));

      toast({
        title: approved ? "Application Approved" : "Application Rejected",
        description: `KYC application for ${application.address.slice(0, 8)}... has been ${approved ? 'approved' : 'rejected'}`,
      });

      setSelectedApplication(null);
    } catch (error) {
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : "Failed to process KYC application",
        variant: "destructive",
      });
    } finally {
      setProcessingApplication(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelText = (level: number) => {
    return level === KYC_LEVEL.ENHANCED ? 'Enhanced' : 'Basic';
  };

  const getDocumentName = (_hash: string, index: number) => {
    // In a real app, you'd map these to actual document types
    const docTypes = ['ID Document', 'Proof of Address', 'Income Proof', 'Business Registration'];
    return docTypes[index] || `Document ${index + 1}`;
  };

  const pendingApplications = applications.filter(app => app.status === KYC_STATUS.PENDING);
  const reviewedApplications = applications.filter(app => app.status !== KYC_STATUS.PENDING);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                  👨‍💼
                </div>
                KYC Review Dashboard
              </CardTitle>
              <CardDescription className="text-gray-400">
                Review and approve supplier identity verification applications
              </CardDescription>
            </div>
            <Button 
              onClick={refreshData}
              disabled={loading}
              variant="outline"
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-400 py-4">
              Loading KYC data from blockchain...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/20">
                <div className="text-blue-400 text-2xl font-bold">{kycStats?.total || 0}</div>
                <div className="text-blue-300 text-sm">Total Applications</div>
              </div>
              <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
                <div className="text-yellow-400 text-2xl font-bold">{kycStats?.pending || 0}</div>
                <div className="text-yellow-300 text-sm">Pending Review</div>
              </div>
              <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/20">
                <div className="text-green-400 text-2xl font-bold">{kycStats?.approved || 0}</div>
                <div className="text-green-300 text-sm">Approved</div>
              </div>
              <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/20">
                <div className="text-red-400 text-2xl font-bold">{kycStats?.rejected || 0}</div>
                <div className="text-red-300 text-sm">Rejected</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Applications */}
      <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Pending Applications</CardTitle>
          <CardDescription className="text-gray-400">
            Applications awaiting review and approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading pending applications from blockchain...
            </div>
          ) : pendingApplications.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">No pending applications to review</div>
              <div className="text-gray-500 text-sm">
                KYC applications will appear here when suppliers submit their documents.
              </div>
              <div className="text-gray-500 text-sm mt-2">
                Current stats: {kycStats?.total || 0} total applications
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((application) => (
                <div key={application.address} className="p-4 bg-gray-800/30 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="text-white font-medium">{formatAddress(application.address)}</div>
                          <div className="text-gray-400 text-sm">
                            {getLevelText(application.level)} KYC • Submitted {formatDate(application.submittedAt)}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded text-sm font-medium ${getKYCStatusColor(application.status)}`}>
                          {getKYCStatusText(application.status)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        {application.documentHashes.length} documents submitted
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedApplication(application)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Review Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-gray-900 border-gray-700 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                KYC Application Review
                <Button
                  onClick={() => setSelectedApplication(null)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Review documents and approve or reject the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Application Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 text-sm">Applicant Address</Label>
                  <div className="text-white font-mono text-sm bg-gray-800/30 p-2 rounded mt-1">
                    {selectedApplication.address}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">KYC Level</Label>
                  <div className="text-white text-sm bg-gray-800/30 p-2 rounded mt-1">
                    {getLevelText(selectedApplication.level)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Submitted</Label>
                  <div className="text-white text-sm bg-gray-800/30 p-2 rounded mt-1">
                    {formatDate(selectedApplication.submittedAt)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Status</Label>
                  <div className={`text-sm p-2 rounded mt-1 ${getKYCStatusColor(selectedApplication.status)}`}>
                    {getKYCStatusText(selectedApplication.status)}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <Label className="text-gray-300 text-sm font-semibold">Submitted Documents</Label>
                <div className="mt-2 space-y-3">
                  {selectedApplication.documentHashes.map((hash, index) => (
                    <IPFSDocumentViewer
                      key={index}
                      documentHash={hash}
                      documentName={getDocumentName(hash, index)}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedApplication.status === KYC_STATUS.PENDING && (
                <div className="flex space-x-4">
                  <Button
                    onClick={() => handleApproval(selectedApplication, false)}
                    disabled={processingApplication === selectedApplication.address}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processingApplication === selectedApplication.address ? "Processing..." : "Reject Application"}
                  </Button>
                  <Button
                    onClick={() => handleApproval(selectedApplication, true)}
                    disabled={processingApplication === selectedApplication.address}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processingApplication === selectedApplication.address ? "Processing..." : "Approve Application"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Applications */}
      <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Recent Reviews</CardTitle>
          <CardDescription className="text-gray-400">
            Previously reviewed applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewedApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No reviewed applications yet
            </div>
          ) : (
            <div className="space-y-4">
              {reviewedApplications.slice(0, 10).map((application) => (
                <div key={application.address} className="p-4 bg-gray-800/30 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{formatAddress(application.address)}</div>
                      <div className="text-gray-400 text-sm">
                        {getLevelText(application.level)} KYC • Reviewed {application.reviewedAt ? formatDate(application.reviewedAt) : 'N/A'}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-medium ${getKYCStatusColor(application.status)}`}>
                      {getKYCStatusText(application.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
