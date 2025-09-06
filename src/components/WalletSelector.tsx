// Internal components
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import {
  APTOS_CONNECT_ACCOUNT_URL,
  AboutAptosConnect,
  type AboutAptosConnectEducationScreen,
  AdapterWallet,
  AdapterNotDetectedWallet,
  AptosPrivacyPolicy,
  WalletItem,
  groupAndSortWallets,
  isAptosConnectWallet,
  isInstallRequired,
  truncateAddress,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Copy,
  LogOut,
  User,
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";

export function WalletSelector() {
  const { account, connected, disconnect, wallet } = useWallet();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const closeDialog = useCallback(() => setIsDialogOpen(false), []);

  const copyAddress = useCallback(async () => {
    if (!account?.address.toStringLong()) return;
    try {
      await navigator.clipboard.writeText(account.address.toStringLong());
      toast({
        title: "Success",
        description: "Copied wallet address to clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy wallet address.",
      });
    }
  }, [account?.address, toast]);

  return connected ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          {account?.ansName || truncateAddress(account?.address.toStringLong()) || "Unknown"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={copyAddress} className="gap-2">
          <Copy className="h-4 w-4" /> Copy address
        </DropdownMenuItem>
        {wallet && isAptosConnectWallet(wallet) && (
          <DropdownMenuItem asChild>
            <a
              href={APTOS_CONNECT_ACCOUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2"
            >
              <User className="h-4 w-4" /> Account
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={disconnect} className="gap-2">
          <LogOut className="h-4 w-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>Connect a Wallet</Button>
      </DialogTrigger>
      <ConnectWalletDialog close={closeDialog} />
    </Dialog>
  );
}

interface ConnectWalletDialogProps {
  close: () => void;
}

function ConnectWalletDialog({ close }: ConnectWalletDialogProps) {
  const { wallets = [], notDetectedWallets = [] } = useWallet();
  const [detectionAttempts, setDetectionAttempts] = useState(0);
  
  // Try to force wallet detection
  useEffect(() => {
    const timer = setTimeout(() => {
      if (wallets.length === 0 && notDetectedWallets.length === 0 && detectionAttempts < 3) {
        setDetectionAttempts(prev => prev + 1);
        console.log(`Wallet detection attempt ${detectionAttempts + 1}`);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [wallets.length, notDetectedWallets.length, detectionAttempts]);

  const { aptosConnectWallets, availableWallets, installableWallets } = groupAndSortWallets([...wallets, ...notDetectedWallets]);

  // Debug logging to see what wallets are detected
  console.log("All wallets:", wallets.map(w => w.name));
  console.log("Not detected wallets:", notDetectedWallets.map(w => w.name));
  console.log("Available wallets:", availableWallets.map(w => w.name));
  console.log("Installable wallets:", installableWallets.map(w => w.name));
  
  // Check for wallet objects in window
  useEffect(() => {
    const checkWallets = () => {
      console.log("=== Wallet Detection Debug ===");
      console.log("Window.aptos:", typeof window !== 'undefined' ? (window as any).aptos : 'undefined');
      console.log("Window.petra:", typeof window !== 'undefined' ? (window as any).petra : 'undefined');
      console.log("Window.pontem:", typeof window !== 'undefined' ? (window as any).pontem : 'undefined');
      console.log("Window.martian:", typeof window !== 'undefined' ? (window as any).martian : 'undefined');
      console.log("Window.fewcha:", typeof window !== 'undefined' ? (window as any).fewcha : 'undefined');
      console.log("Window.okxwallet:", typeof window !== 'undefined' ? (window as any).okxwallet : 'undefined');
    };
    
    // Check immediately and after a delay
    checkWallets();
    const timer = setTimeout(checkWallets, 2000);
    return () => clearTimeout(timer);
  }, []);

  const hasAptosConnectWallets = !!aptosConnectWallets.length;
  
  // Show a message if no wallets are detected
  const noWalletsDetected = wallets.length === 0 && notDetectedWallets.length === 0;

  return (
    <DialogContent className="max-h-screen overflow-auto">
      <AboutAptosConnect renderEducationScreen={renderEducationScreen}>
        <DialogHeader>
          <DialogTitle className="flex flex-col text-center leading-snug">
            {hasAptosConnectWallets ? (
              <>
                <span>Log in or sign up</span>
                <span>with Social + Aptos Connect</span>
              </>
            ) : (
              "Connect Wallet"
            )}
          </DialogTitle>
        </DialogHeader>

        {hasAptosConnectWallets && (
          <div className="flex flex-col gap-2 pt-3">
            {aptosConnectWallets.map((wallet) => (
              <AptosConnectWalletRow
                key={wallet.name}
                wallet={wallet}
                onConnect={close}
              />
            ))}
            <p className="flex gap-1 justify-center items-center text-muted-foreground text-sm">
              Learn more about{" "}
              <AboutAptosConnect.Trigger className="flex gap-1 py-3 items-center text-foreground">
                Aptos Connect <ArrowRight size={16} />
              </AboutAptosConnect.Trigger>
            </p>
            <AptosPrivacyPolicy className="flex flex-col items-center py-1">
              <p className="text-xs leading-5">
                <AptosPrivacyPolicy.Disclaimer />{" "}
                <AptosPrivacyPolicy.Link className="text-muted-foreground underline underline-offset-4" />
                <span className="text-muted-foreground">.</span>
              </p>
              <AptosPrivacyPolicy.PoweredBy className="flex gap-1.5 items-center text-xs leading-5 text-muted-foreground" />
            </AptosPrivacyPolicy>
            <div className="flex items-center gap-3 pt-4 text-muted-foreground">
              <div className="h-px w-full bg-secondary" />
              Or
              <div className="h-px w-full bg-secondary" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-3">
          {noWalletsDetected ? (
            <div className="text-center py-8 px-4">
              <div className="mb-4 text-4xl">🔍</div>
              <h3 className="font-semibold mb-2">No Wallets Detected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No Aptos wallet extensions were found in your browser.
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Install a wallet to continue:</p>
                <div className="space-y-1">
                  <a 
                    href="https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-2 rounded border hover:bg-gray-50 transition-colors"
                  >
                    🪨 Petra Wallet (Recommended)
                  </a>
                  <a 
                    href="https://chrome.google.com/webstore/detail/pontem-aptos-wallet/phkbamefinggmakgklpkljjmgibohnba" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-2 rounded border hover:bg-gray-50 transition-colors"
                  >
                    🟣 Pontem Wallet
                  </a>
                  <a 
                    href="https://chrome.google.com/webstore/detail/martian-aptos-wallet/efbglgofoippbgcjepnhiblaibcnclgk" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-2 rounded border hover:bg-gray-50 transition-colors"
                  >
                    👽 Martian Wallet
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  After installing, refresh this page and try connecting again.
                </p>
              </div>
            </div>
          ) : (
            <>
              {availableWallets.map((wallet) => (
                <WalletRow key={wallet.name} wallet={wallet} onConnect={close} />
              ))}
              {!!installableWallets.length && (
                <Collapsible className="flex flex-col gap-3">
                  <CollapsibleTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-2">
                      More wallets <ChevronDown />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex flex-col gap-3">
                    {installableWallets.map((wallet) => (
                      <WalletRow
                        key={wallet.name}
                        wallet={wallet}
                        onConnect={close}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </div>
      </AboutAptosConnect>
    </DialogContent>
  );
}

interface WalletRowProps {
  wallet: AdapterWallet | AdapterNotDetectedWallet;
  onConnect?: () => void;
}

function WalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem
      wallet={wallet}
      onConnect={onConnect}
      className="flex items-center justify-between px-4 py-3 gap-4 border rounded-md"
    >
      <div className="flex items-center gap-4">
        <WalletItem.Icon className="h-6 w-6" />
        <WalletItem.Name className="text-base font-normal" />
      </div>
      {isInstallRequired(wallet) ? (
        <Button size="sm" variant="ghost" asChild>
          <WalletItem.InstallLink />
        </Button>
      ) : (
        <WalletItem.ConnectButton asChild>
          <Button size="sm">Connect</Button>
        </WalletItem.ConnectButton>
      )}
    </WalletItem>
  );
}

function AptosConnectWalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem wallet={wallet} onConnect={onConnect}>
      <WalletItem.ConnectButton asChild>
        <Button size="lg" variant="outline" className="w-full gap-4">
          <WalletItem.Icon className="h-5 w-5" />
          <WalletItem.Name className="text-base font-normal" />
        </Button>
      </WalletItem.ConnectButton>
    </WalletItem>
  );
}

function renderEducationScreen(screen: AboutAptosConnectEducationScreen) {
  return (
    <>
      <DialogHeader className="grid grid-cols-[1fr_4fr_1fr] items-center space-y-0">
        <Button variant="ghost" size="icon" onClick={screen.cancel}>
          <ArrowLeft />
        </Button>
        <DialogTitle className="leading-snug text-base text-center">
          About Aptos Connect
        </DialogTitle>
      </DialogHeader>

      <div className="flex h-[162px] pb-3 items-end justify-center">
        <screen.Graphic />
      </div>
      <div className="flex flex-col gap-2 text-center pb-4">
        <screen.Title className="text-xl" />
        <screen.Description className="text-sm text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a]:text-foreground" />
      </div>

      <div className="grid grid-cols-3 items-center">
        <Button
          size="sm"
          variant="ghost"
          onClick={screen.back}
          className="justify-self-start"
        >
          Back
        </Button>
        <div className="flex items-center gap-2 place-self-center">
          {screen.screenIndicators.map((ScreenIndicator, i) => (
            <ScreenIndicator key={i} className="py-4">
              <div className="h-0.5 w-6 transition-colors bg-muted [[data-active]>&]:bg-foreground" />
            </ScreenIndicator>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={screen.next}
          className="gap-2 justify-self-end"
        >
          {screen.screenIndex === screen.totalScreens - 1 ? "Finish" : "Next"}
          <ArrowRight size={16} />
        </Button>
      </div>
    </>
  );
}
