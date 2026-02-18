import { UserButton } from "@clerk/nextjs";
import { Code } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-primary">SchemaGen</h1>
            <p className="text-xs text-slate-500">E-commerce SEO Schema</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Upgrade to Pro
          </Button>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-9 h-9",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
