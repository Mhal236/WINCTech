import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Cpu, Bot, ShieldCheck, Zap } from "lucide-react";

const TonyAI = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#23b7c0]/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#148189]/20 blur-3xl" />

          <div className="relative p-8 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-[#23b7c0]" />
              Preview
            </div>

            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-[#23b7c0] via-[#1a9ca5] to-[#148189] bg-clip-text text-transparent animate-pulse">
                Try Tony A.I
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base text-white/70">
              A futuristic Windscreen Assistant for repair technicians. From smart ARGIC lookups to on-site guidance, Tony A.I streamlines every step.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button className="bg-[#148189] hover:bg-[#148189]/90">
                <Sparkles className="h-4 w-4 mr-2" />
                Request Early Access
              </Button>
              <span className="text-xs text-white/60">No pricing yet. Feature preview only.</span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-[#148189]" />
                Smart Part Matching
              </CardTitle>
              <CardDescription>ARGIC-aware suggestions tailored to vehicle, sensors, and stock context.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                Reduce misorders with intelligent context and compatibility hints.
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#148189]" />
                On‑Site Guidance
              </CardTitle>
              <CardDescription>Step-by-step procedures, tools, adhesives, and torque refs at a glance.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">Interactive checklists adapt to the job in real time.</div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#148189]" />
                Safety & Compliance
              </CardTitle>
              <CardDescription>Adhesive cure windows, recalibration notices, and safety prompts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">Built-in reminders reduce risk and rework.</div>
            </CardContent>
          </Card>

          <Card className="bg-white md:col-span-2 lg:col-span-3">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Coming soon</h3>
                  <p className="text-sm text-gray-600 mt-1">Tony A.I is in active development. Share your use cases and help shape the roadmap.</p>
                </div>
                <Button variant="outline" className="border-[#23b7c0] text-[#148189]">
                  <Zap className="h-4 w-4 mr-2" />
                  Join the Pilot List
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TonyAI;


