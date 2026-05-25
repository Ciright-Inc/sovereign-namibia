"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="keyra-hero relative px-6 pb-16 pt-20 md:pb-24 md:pt-28">
      <div className="mx-auto max-w-4xl">
        {eyebrow && <p className="sn-eyebrow mb-4">{eyebrow}</p>}
        <h1 className="sn-display">{title}</h1>
        {subtitle && <p className="mt-6 max-w-2xl sn-prose">{subtitle}</p>}
        {children && <div className="mt-10 flex flex-wrap gap-4">{children}</div>}
      </div>
    </section>
  );
}
