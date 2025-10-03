import {
  ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import { supabase } from "../lib/supabaseClient";
import { useAppContext } from "../lib/AppContext";

type AppLayoutProps = {
  children: ReactNode;
  backgroundColor?: string;
  messages?: any;
  locale?: string;
};

type SidebarContextValue = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({
  isSidebarOpen: false,
  toggleSidebar: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export default function AppLayout({
  children,
  backgroundColor: propBackgroundColor,
  messages,
  locale,
}: AppLayoutProps) {
  const { backgroundColor: contextBackgroundColor } = useAppContext();
  const [user, setUser] = useState<any>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const backgroundColor = propBackgroundColor || contextBackgroundColor;

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/auth/login");
      setUser(user);
    };
    init();
  }, [router]);

  const sidebarContextValue: SidebarContextValue = {
    isSidebarOpen,
    toggleSidebar: () => setIsSidebarOpen((prev) => !prev),
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="fixed inset-0 flex bg-white">
        <div
          className={`md:m-2 m-[0px_8px_8px_0px] ${
            isSidebarOpen !== true ? "hidden md:block" : "block"
          }`}
        >
          <Sidebar
            user={user}
            activeWorkspaceId={activeWorkspaceId}
            setActiveWorkspaceId={setActiveWorkspaceId}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            messages={messages}
          />
        </div>
        <div className="flex min-h-svh w-full flex-col md:pr-3 overflow-y-auto">
          <div className="relative flex w-full flex-1 flex-col overflow-clip md:rounded-lg">
            <div
              className="relative flex min-h-16 w-full items-center justify-between bg-transparent px-4 py-3 md:hidden"
              style={{ backgroundColor }}
            >
              <button
                className="inline-flex items-center justify-center rounded-md h-10 w-10"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                aria-label="Toggle sidebar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="size-6 stroke-2 stroke-black"
                >
                  <path
                    d="M3 12H21M3 6H21M3 18H21"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="flex h-full w-full flex-1 flex-col">{children}</div>
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
