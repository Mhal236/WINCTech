import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { MessageCircle, Mail, Phone, MapPin, Users } from "lucide-react";
import { useState } from "react";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const teamMembers = [
    {
      name: "Michael Chen",
      role: "Account Manager",
      email: "Michael@windscreencompare.com",
      phone: "020 7946 0123"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible.",
    });
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#145484] mb-8">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-[#145484]">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="border-[#145484]/20"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="border-[#145484]/20"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Your message"
                    className="min-h-[150px] border-[#145484]/20"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-[#145484]">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-[#145484]" />
                  <span>technician@windscreencompare.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-[#145484]" />
                  <span>020 7946 0123</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="text-[#145484]" />
                  <span>221B Baker Street, London, NW1 6XE, UK</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-6 w-6 text-[#145484]" />
                <h2 className="text-2xl font-semibold text-[#145484]">Our Team</h2>
              </div>
              <div className="space-y-6">
                {teamMembers.map((member) => (
                  <div
                    key={member.name}
                    className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{member.role}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-[#145484]" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 text-[#145484]" />
                        <span>{member.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Chat Button */}
          <div className="relative">
            {!isChatOpen ? (
              <Button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 rounded-full p-4 shadow-lg"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            ) : (
              <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl">
                <div className="bg-[#FFC107] text-gray-900 p-4 rounded-t-lg flex justify-between items-center">
                  <h3 className="font-semibold">Live Chat</h3>
                  <button onClick={() => setIsChatOpen(false)} className="text-gray-900 hover:text-gray-700">
                    ×
                  </button>
                </div>
                <div className="h-96 p-4 overflow-y-auto">
                  <div className="text-center text-gray-500">
                    Start a conversation with our support team
                  </div>
                </div>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input placeholder="Type your message..." className="border-[#145484]/20" />
                    <Button>Send</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Contact;
