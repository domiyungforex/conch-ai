import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { RenewalBanner } from "@/components/dashboard/RenewalBanner";
import { CmdKSearchDialog } from "@/components/shared/CmdKSearchDialog";
import { Web3Provider } from "@/providers/Web3Provider";
import { WalletStateProvider } from "@/providers/WalletStateProvider";
import { AppwriteRealtimeProvider } from "@/providers/AppwriteRealtimeProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <WalletStateProvider>
        <AppwriteRealtimeProvider>
          <div className="flex h-dvh overflow-hidden bg-background">
            {/* Sidebar — desktop only (md+), hidden on mobile in favor of hamburger menu */}
            <div className="hidden md:flex h-full">
              <Sidebar />
            </div>

            {/* Main content area */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <Topbar />
              <RenewalBanner />
              <main className="flex-1 w-full overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
          <CmdKSearchDialog />
        </AppwriteRealtimeProvider>
      </WalletStateProvider>
    </Web3Provider>
  );
}
