import { Sidebar } from "@/components/layout/Sidebar";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="mt-2 text-muted-foreground">Configure global bot settings and fees.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold">General Configuration</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bot-name">Bot Name</Label>
                  <Input id="bot-name" defaultValue="Nuvixpay Bot" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fee-rate">Transaction Fee (%)</Label>
                  <Input id="fee-rate" type="number" defaultValue="2.5" />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-Approval</Label>
                    <p className="text-sm text-muted-foreground">Automatically approve new users</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Disable bot interactions temporarily</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            </div>
            
            {/* Placeholder for future settings */}
            <div className="bg-card/50 rounded-2xl border border-border border-dashed p-6 flex items-center justify-center text-muted-foreground">
              <p>More settings coming soon...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
