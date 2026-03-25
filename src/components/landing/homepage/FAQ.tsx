import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "What is AgriSmart?",
    answer:
      "AgriSmart is a smart agriculture platform that uses data, artificial intelligence, and environmental insights to help farmers improve crop productivity, reduce losses, and make better farming decisions.",
  },
  {
    question: "Who can use AgriSmart?",
    answer:
      "AgriSmart is designed for multiple users including: Individual farmers, Farmer cooperatives, Agricultural NGOs, Government agricultural programs, Research organizations, and Agricultural extension officers.",
  },
  {
    question: "Do farmers have to pay to use AgriSmart?",
    answer:
      "No. AgriSmart is free for individual farmers. The platform is supported by cooperatives, NGOs, and government programs that use AgriSmart to support farmers at scale.",
  },
  {
    question: "What services does AgriSmart provide to farmers?",
    answer:
      "Farmers using AgriSmart can access: AI-powered crop recommendations, Weather and climate alerts, Crop disease detection insights, Smart farming tips and advisory, Soil and environmental insights, and Farm activity tracking.",
  },
  {
    question: "How does AgriSmart use artificial intelligence?",
    answer:
      "AgriSmart uses machine learning and data analysis to understand crop patterns, environmental conditions, and farming practices. The AI then generates insights and recommendations that help farmers make better decisions and improve yields.",
  },
  {
    question: "How can a cooperative use AgriSmart?",
    answer:
      "Farmer cooperatives can use AgriSmart to manage multiple farms, track productivity across members, access crop insights, and provide data-driven support to farmers within the cooperative.",
  },
  {
    question: "What benefits do NGOs and government programs get from AgriSmart?",
    answer:
      "NGOs and government agricultural programs can use AgriSmart to monitor large-scale farming programs, track impact, analyze agricultural data, and improve food security initiatives.",
  },
  {
    question: "How much does AgriSmart cost for organizations?",
    answer:
      "Farmers use AgriSmart for free. Cooperatives can subscribe to the Cooperative Plan starting at KSh 30,000 per month with a 60-day free trial. Government and NGO programs can subscribe to the Government Plan starting at KSh 100,000 per month, with discounted yearly plans available.",
  },
  {
    question: "Is there a free trial for organizations?",
    answer:
      "Yes. Cooperatives can start with a 60-day free trial to test the AgriSmart platform before subscribing.",
  },
  {
    question: "Does AgriSmart work on mobile phones?",
    answer:
      "Yes. AgriSmart is designed to work on smartphones, tablets, and computers so farmers and organizations can access insights from anywhere.",
  },
  {
    question: "Where is AgriSmart based?",
    answer:
      "AgriSmart is currently headquartered in Kisumu, Kenya, with plans to expand operations to Nairobi and other agricultural regions.",
  },
  {
    question: "How secure is the data on AgriSmart?",
    answer:
      "AgriSmart takes data security seriously. The platform uses secure cloud infrastructure and follows best practices for protecting agricultural and organizational data.",
  },
  {
    question: "What technologies power AgriSmart?",
    answer:
      "AgriSmart is powered by modern technologies including: Artificial Intelligence and Machine Learning, Cloud computing platforms, Environmental and weather data systems, and Open-source mapping tools such as OpenStreetMap.",
  },
  {
    question: "How can organizations partner with AgriSmart?",
    answer:
      "Organizations interested in partnering with AgriSmart can reach out through the contact section of the website or via email at agrismartk@gmail.com.",
  },
  {
    question: "How do I get started with AgriSmart?",
    answer:
      "Farmers can start using AgriSmart immediately through the platform. Cooperatives, NGOs, and government organizations can contact the AgriSmart team to begin onboarding and explore available plans.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20">
      <div className="app-page-shell space-y-10">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Frequently Asked Questions
          </div>
          <h2 className="mt-6 font-heading text-3xl font-semibold text-foreground md:text-4xl">
            Everything You Need to Know About AgriSmart
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
            Learn how AgriSmart helps farmers, cooperatives, NGOs, and governments use data and AI to improve agricultural
            productivity and sustainability.
          </p>
        </div>

        <Accordion type="single" collapsible className="columns-1 gap-6 lg:columns-2">
          {faqs.map((faq) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className="agri-card mb-6 break-inside-avoid"
            >
              <AccordionItem value={faq.question} className="border-none">
                <AccordionTrigger className="text-left text-sm font-semibold text-foreground no-underline hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="agri-card flex flex-col items-center gap-4 text-center"
        >
          <h3 className="text-xl font-semibold text-foreground">Still Have Questions?</h3>
          <p className="text-sm text-muted-foreground">
            Our team is happy to help you understand how AgriSmart can support farmers and agricultural programs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#contact" className="agri-btn-primary">
              Contact Us
            </a>
            <a href="mailto:agrismartk@gmail.com" className="agri-btn-secondary">
              Email Support
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

