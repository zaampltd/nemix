"use client";
/**
 * Stripe Provider
 * Wrap pages that need Stripe with this component.
 * Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in frontend/.env.local
 */
import React, { ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";

// Singleton — loadStripe is called once
let stripePromise: Promise<Stripe | null> | null = null;

function getStripe() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string; // pass when you have a PaymentIntent
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const options = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "stripe" as const,
          variables: {
            colorPrimary: "#5b5bd6",
            colorBackground: "#f2f2ff",
            colorText: "#1b1b22",
            colorDanger: "#ba1a1a",
            borderRadius: "12px",
            fontFamily: "Inter, sans-serif",
          },
        },
      }
    : undefined;

  return (
    <Elements stripe={getStripe()} options={options}>
      {children}
    </Elements>
  );
}
