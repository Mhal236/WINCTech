import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  BarChart, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  Box, 
  ShoppingCart, 
  Star 
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Reference the logo
const logo = "/windscreen-compare-technician.png";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut" 
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const LandingPage = () => {
  return (
    <div className="bg-white min-h-screen w-full">
      {/* Header */}
      <header className="bg-white py-6 px-6 md:px-16 w-full flex items-center justify-between sticky top-0 z-50 shadow-sm border-b border-amber-100">
        <div className="flex items-center space-x-12">
          <div className="flex items-center gap-2">
            <div className="h-10 overflow-hidden">
              <img 
                src={logo} 
                alt="Windscreen Compare Technician" 
                className="h-full object-contain"
              />
            </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            {["Product", "Integrations", "Pricing", "Contact Us", "Careers"].map((item) => (
              <motion.a 
                key={item}
                href="#" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" className="rounded-full px-6 font-medium border-amber-400 text-amber-700">
            Get Template
          </Button>
        </motion.div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 md:px-16 w-full">
        <motion.div 
          className="text-center mb-12 max-w-[1200px] mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 text-slate-900 leading-tight"
            variants={fadeIn}
          >
            Order windscreen glass <span className="text-amber-600">instantly</span> with our fast software
          </motion.h1>
          <motion.p 
            className="text-gray-700 max-w-3xl mx-auto mb-10 text-lg"
            variants={fadeIn}
          >
            Understand your market better with accurate, real-time insights. Analyze trends, track competitors – all in one place.
          </motion.p>
          <motion.div 
            className="flex flex-col md:flex-row gap-4 justify-center"
            variants={fadeIn}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="px-8 py-6 rounded-md text-lg font-medium h-auto bg-[#FFC107] hover:bg-[#FFAB00] text-gray-900">
                Get Started for Free
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="px-8 py-6 rounded-md text-lg font-medium border-amber-400 text-amber-700 h-auto">
                Contact Sales
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div 
          className="mt-16 bg-white rounded-xl shadow-xl p-4 w-full max-w-[1200px] mx-auto overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <img src="/dashboard-preview.png" alt="Dashboard Preview" className="w-full rounded-lg" />
        </motion.div>
        <div className="mt-16 text-center">
          <p className="text-lg font-semibold text-gray-700 mb-4">All In one tool for growth mindset</p>
          <p className="text-base text-gray-500">Trusted by big brands around the world</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 md:px-16 w-full bg-amber-50">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center mb-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          All features in <span className="text-amber-600">1 tool</span>
        </motion.h2>
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="text-lg mb-2">
            <span className="font-bold">Analyze with Ease:</span> Simplify your analytics with powerful tools.
          </p>
          <p className="text-lg text-gray-600">
            <span className="font-bold">Insights Drive Growth:</span> Leverage actionable data to scale.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeIn} whileHover={{ y: -15 }}>
            <Card className="p-8 rounded-2xl border-0 shadow-xl transition-all duration-300 h-full">
              <div className="mb-6">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Data-driven</h3>
              <p className="text-gray-600">Empower your team with tools that transform data into clear, actionable insights & much more.</p>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn} whileHover={{ y: -15 }}>
            <Card className="p-8 rounded-2xl border-0 shadow-xl transition-all duration-300 h-full">
              <div className="mb-6">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <BarChart className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Visual analytics</h3>
              <p className="text-gray-600">Understand your metrics like never before with stunning, easy-to-read dashboards with visual analytics.</p>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn} whileHover={{ y: -15 }}>
            <Card className="p-8 rounded-2xl border-0 shadow-xl transition-all duration-300 h-full">
              <div className="mb-6">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Collaboration made easy</h3>
              <p className="text-gray-600">Streamline Teamwork, Amplify Results</p>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn} whileHover={{ y: -15 }}>
            <Card className="p-8 rounded-2xl border-0 shadow-xl transition-all duration-300 h-full">
              <div className="mb-6">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <BarChart className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Powerful growth metrics</h3>
              <p className="text-gray-600">Stay ahead with real-time tracking tools</p>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn} whileHover={{ y: -15 }}>
            <Card className="p-8 rounded-2xl border-0 shadow-xl transition-all duration-300 h-full">
              <div className="mb-6">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Competitor Insight stats</h3>
              <p className="text-gray-600">Understand your competitor and remain ahead</p>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 md:px-16 w-full bg-gray-50">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center mb-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Their <span className="text-amber-600">success stories</span>
        </motion.h2>
        <motion.p
          className="text-center text-gray-600 max-w-2xl mx-auto mb-16 text-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          See how our users have achieved incredible results with Windscreen Compare. Explore their success stories and discover.
        </motion.p>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div 
              key={i} 
              variants={fadeIn} 
              whileHover={{ y: -10 }}
              className={`bg-white p-8 rounded-2xl shadow-lg ${i > 3 ? 'hidden md:block' : ''} ${i === 1 ? 'border-2 border-amber-300' : ''}`}
            >
              <h3 className="font-semibold text-xl mb-3">Kenny Martin</h3>
              <p className="text-gray-600 mb-6">LanderOS helped us uncover hidden traffic sources and optimize our campaigns.</p>
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-amber-500" fill="#F59E0B" />
                  ))}
                </div>
                <span className="ml-2 font-semibold">5.0</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <motion.div 
          className="flex justify-center items-center gap-16 mt-20 max-w-[1000px] mx-auto flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="text-center">
            <h3 className="text-4xl font-bold text-amber-600 mb-2">100<span className="text-lg align-top">k+</span></h3>
            <p className="text-gray-600">Happy users</p>
          </div>
          <div className="text-center">
            <h3 className="text-4xl font-bold text-amber-600 mb-2">250<span className="text-lg align-top">k+</span></h3>
            <p className="text-gray-600">Total hrs saved</p>
          </div>
          <div className="text-center">
            <h3 className="text-4xl font-bold text-amber-600 mb-2">4.8</h3>
            <p className="text-gray-600">Average Rating</p>
          </div>
        </motion.div>
      </section>

      {/* Integration Section */}
      <section className="py-24 px-6 md:px-16 w-full bg-amber-50">
        <motion.div
          className="max-w-[1200px] mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center mb-2"
            variants={fadeIn}
          >
            Connect with all of your <span className="text-amber-600">favourite apps</span>
          </motion.h2>
          <motion.p
            className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg"
            variants={fadeIn}
          >
            Interact with all your favorite software without unnecessary fuss, concentrating solely on your enterprise and it's growth
          </motion.p>
          
          <motion.div 
            className="flex flex-col md:flex-row gap-4 justify-center mb-16"
            variants={fadeIn}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="px-8 py-6 rounded-md text-lg font-medium h-auto bg-[#FFC107] hover:bg-[#FFAB00] text-gray-900">
                Get Started for Free
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="px-8 py-6 rounded-md text-lg font-medium border-amber-400 text-amber-700 h-auto">
                Contact Sales
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-3 md:grid-cols-6 gap-6 max-w-[1000px] mx-auto mb-16"
            variants={fadeIn}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <motion.div 
                key={i} 
                className="h-16 w-16 rounded-lg bg-white shadow-md flex items-center justify-center mx-auto"
                whileHover={{ y: -5, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)' }}
              >
                <span className="text-gray-400 text-xl">{i}</span>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.p
            className="text-center text-gray-700 font-medium text-xl mt-12"
            variants={fadeIn}
          >
            "Connect with 100's of apps without leaving the site"
          </motion.p>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 md:px-16 w-full">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Pricing plans
        </motion.h2>
        <motion.p
          className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Our charges are straightforward and equitable, devoid of hidden fees, upgrading to an enhanced plan is always feasible.
        </motion.p>
        
        <motion.div 
          className="flex justify-center mb-12 space-x-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <span className="text-lg font-medium px-4 py-2 bg-gray-100 rounded-full">Monthly</span>
          <span className="text-lg font-medium text-gray-500 px-4 py-2">Yearly</span>
          <span className="text-sm bg-blue-100 text-[#145484] px-3 py-1 rounded-full font-medium">30% off</span>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeIn} whileHover={{ y: -10 }}>
            <Card className="p-8 rounded-2xl border-0 shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-600">Starter</h3>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$12</span>
                  <span className="text-gray-500 ml-1">user/month</span>
                </div>
              </div>
              <div className="mb-8">
                <Button className="w-full py-6 text-lg font-medium h-auto">
                  Get Started For Free
                </Button>
              </div>
              <ul className="space-y-4">
                {[
                  "Everything in starter plan",
                  "Unlimited AI usage here",
                  "Premium support",
                  "Customer care on point",
                  "Collaboration tools"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#145484] flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn} whileHover={{ y: -10 }}>
            <Card className="p-8 rounded-2xl border-0 shadow-2xl transition-all duration-300 relative overflow-hidden scale-105 z-10">
              <div className="absolute -top-1 right-0 bg-[#145484] text-white px-6 py-2 font-medium rotate-0 rounded-b-lg shadow-lg">
                Popular
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-600">Pro</h3>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$17</span>
                  <span className="text-gray-500 ml-1">user/month</span>
                </div>
              </div>
              <div className="mb-8">
                <Button className="w-full py-6 text-lg font-medium h-auto">
                  Get Started For Free
                </Button>
              </div>
              <ul className="space-y-4">
                {[
                  "Everything in starter plan",
                  "Integrations with 3rd-party",
                  "Advanced analytics",
                  "Team performance tracking",
                  "Top grade security"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#145484] flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn} whileHover={{ y: -10 }}>
            <Card className="p-8 rounded-2xl border-0 shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-600">Enterprise</h3>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$97</span>
                  <span className="text-gray-500 ml-1">user/month</span>
                </div>
              </div>
              <div className="mb-8">
                <Button className="w-full py-6 text-lg font-medium h-auto">
                  Get Started For Free
                </Button>
              </div>
              <ul className="space-y-4">
                {[
                  "Everything in starter plan",
                  "Dedicated account manager",
                  "Custom reports & dashboards",
                  "Most performance usage",
                  "Most performance usage"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#145484] flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </motion.div>
        <motion.p 
          className="text-center text-gray-500 text-base mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          We donate 2% of your membership to pediatric wellbeing
        </motion.p>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 md:px-16 w-full bg-gray-50">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Questions answered
        </motion.h2>
        <motion.p
          className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          We're here to help you and solve objections. Find answers to the most common questions below.
        </motion.p>
        
        <motion.div 
          className="flex flex-col md:flex-row gap-4 justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="px-8 py-6 rounded-md text-lg font-medium h-auto bg-[#FFC107] hover:bg-[#FFAB00] text-gray-900">
              Get Started for Free
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" className="px-8 py-6 rounded-md text-lg font-medium border-amber-400 text-amber-700 h-auto">
              Contact Sales
            </Button>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="space-y-4 max-w-[900px] mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          {[
            "What is included in the Starter plan?",
            "Can I switch plans later?",
            "How secure is my data?",
            "Can I integrate this platform with other tools?",
            "Do you offer a free trial?",
            "What payment methods do you accept?",
            "How does the 2% donation work?",
            "What makes your platform different?"
          ].map((question, i) => (
            <motion.div 
              key={i} 
              className="border-b border-gray-200 pb-4"
              variants={fadeIn}
              whileHover={{ backgroundColor: 'rgba(245, 245, 255, 0.5)' }}
            >
              <button className="flex justify-between items-center w-full text-left py-4 px-4 rounded-lg hover:bg-white">
                <span className="font-medium text-lg">{question}</span>
                <ChevronDown className="h-5 w-5 text-gray-500" />
              </button>
            </motion.div>
          ))}
        </motion.div>
        <motion.p 
          className="text-center text-gray-500 text-base mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Feel free to get in touch: technician@windscreencompare.com
        </motion.p>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-16 w-full">
        <motion.div 
          className="bg-amber-50 rounded-3xl p-12 text-center max-w-[1200px] mx-auto shadow-lg border border-amber-100"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            What you still waiting!!
          </motion.h2>
          <motion.p 
            className="text-gray-600 max-w-2xl mx-auto mb-12 text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Regarded by thousands, this platform functions as a user friendly tool, significantly reducing time and helping businesses around the world.
          </motion.p>
          
          <motion.div 
            className="flex justify-center gap-16 mb-12" 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="text-center">
              <p className="font-medium text-lg">100% safe payment</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">10k+ people trust us</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex flex-col md:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="px-8 py-6 rounded-md text-lg font-medium h-auto bg-[#FFC107] hover:bg-[#FFAB00] text-gray-900">
                Get Started for Free
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="px-8 py-6 rounded-md text-lg font-medium border-amber-400 text-amber-700 h-auto">
                Contact Sales Now
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 px-6 md:px-16 w-full border-t border-amber-100">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center space-x-2 mb-8 md:mb-0">
              <div className="h-10 overflow-hidden">
                <img 
                  src={logo} 
                  alt="Windscreen Compare Technician" 
                  className="h-full object-contain"
                />
              </div>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-amber-700">
                <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </div>
              </a>
              <a href="#" className="text-gray-500 hover:text-amber-700">
                <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </div>
              </a>
              <a href="#" className="text-gray-500 hover:text-amber-700">
                <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </div>
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Features</a></li>
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Pricing</a></li>
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Integrations</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Success Stories</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Case Studies</a></li>
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Testimonials</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact Us</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Support</a></li>
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Sales</a></li>
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Help Center</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Careers</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Job Openings</a></li>
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Benefits</a></li>
                <li><a href="#" className="text-gray-500 hover:text-amber-700">Our Team</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">© 2024 WindscreenCompare. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="text-sm text-gray-500">Made by Framebase</span>
              <span className="text-sm text-gray-500">Built in Framer</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 