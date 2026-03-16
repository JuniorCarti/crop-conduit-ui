import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const roles = [
  {
    title: "Project Coordinator",
    description: "Oversee project timelines and coordinate cross-team delivery milestones.",
    image:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
  },
  {
    title: "Finance & Admin Officer",
    description: "Manage budgets, documentation, and operational reporting for the volunteer program.",
    image:
      "https://images.unsplash.com/photo-1554224155-1696413565d3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
  },
  {
    title: "Partnerships & Community Coordinator",
    description: "Build relationships with cooperatives and community leaders to scale impact.",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
  },
  {
    title: "Operations & Logistics Officer",
    description: "Coordinate logistics, resources, and on-the-ground support for pilot activities.",
    image:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
  },
  {
    title: "Monitoring & Evaluation Officer",
    description: "Track performance metrics and deliver insights on pilot outcomes.",
    image:
      "https://images.unsplash.com/photo-1523966211575-eb4a01e7dd51?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
  },
  {
    title: "Technical Support Administrator",
    description: "Provide technical assistance and troubleshoot platform access for volunteer teams.",
    image:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
  },
];

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function VolunteerOpportunities() {
  const [motivation, setMotivation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wordCount = useMemo(() => countWords(motivation), [motivation]);
  const wordLimit = 500;
  const overLimit = wordCount > wordLimit;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (overLimit) {
      setError("Please keep the motivation statement under 500 words.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const requiredFields = ["fullName", "email", "phone", "position", "resume", "coverLetter", "motivation"];
    for (const field of requiredFields) {
      const value = formData.get(field);
      if (!value || (value instanceof File && value.size === 0)) {
        setError("Please complete all required fields before submitting.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("https://formcarry.com/s/6rfNpQfaxhh", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        setError("Submission failed. Please try again.");
        return;
      }

      form.reset();
      setMotivation("");
      setSubmitted(true);
    } catch (err) {
      setError("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="volunteer" className="py-12">
      <div className="app-page-shell space-y-8">
        <div className="max-w-2xl">
          <p className="agri-section-label">Apply to Volunteer</p>
          <h2 className="agri-section-title">Apply to Volunteer</h2>
          <p className="mt-3 text-muted-foreground">
            Fill in your details and submit your application to join AgriSmart.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.03 }}
              viewport={{ once: true, amount: 0.3 }}
              className="agri-card flex h-full flex-col gap-3"
            >
              <div className="overflow-hidden rounded-2xl bg-muted">
                <img src={role.image} alt={role.title} className="h-36 w-full object-cover" loading="lazy" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{role.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{role.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-primary/10 px-6 py-8 text-center shadow-lg"
          >
            <p className="text-2xl font-semibold text-primary">
              Thank you for your submission. We'll get back to you with next steps.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            className="agri-card space-y-4"
            action="https://formcarry.com/s/6rfNpQfaxhh"
            method="POST"
            encType="multipart/form-data"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                Full Name
                <input
                  type="text"
                  name="fullName"
                  className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                  placeholder="Your name"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                Email
                <input
                  type="email"
                  name="email"
                  className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                  placeholder="you@email.com"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                Phone
                <input
                  type="tel"
                  name="phone"
                  className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                  placeholder="+254 7xx xxx xxx"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                Position Applying For
                <select
                  name="position"
                  className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.title} value={role.title}>
                      {role.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                Resume Upload (PDF/DOC/DOCX)
                <input
                  type="file"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                Cover Letter Upload (PDF/DOC/DOCX)
                <input
                  type="file"
                  name="coverLetter"
                  accept=".pdf,.doc,.docx"
                  className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                Motivation Statement
                <textarea
                  name="motivation"
                  rows={5}
                  value={motivation}
                  onChange={(event) => setMotivation(event.target.value)}
                  className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                  placeholder="Why do you want to volunteer?"
                  required
                />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {wordCount} / {wordLimit} words
                </span>
                {overLimit ? <span className="text-destructive">Please keep it under 500 words.</span> : null}
              </div>
              </label>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <button type="submit" className="agri-btn-primary" disabled={overLimit || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </motion.form>
        )}
      </div>
    </section>
  );
}
