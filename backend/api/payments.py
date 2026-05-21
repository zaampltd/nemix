"""
Stripe Payments API
Handles PaymentIntent creation, webhook processing, and subscription management.
"""
import os
import stripe
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/payments", tags=["payments"])

# ── Stripe configuration ─────────────────────────────────────────
# Set STRIPE_SECRET_KEY in your .env file
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# ── Plan price mapping ────────────────────────────────────────────
PLAN_PRICES = {
    "pro":      {"amount": 4900,  "currency": "usd", "name": "Nemix Pro"},
    "business": {"amount": 19900, "currency": "usd", "name": "Nemix Business"},
}

# ── Schemas ───────────────────────────────────────────────────────
class CreateIntentRequest(BaseModel):
    plan_id: str                   # "pro" | "business"
    email: Optional[str] = None    # customer email (optional)

class CreateIntentResponse(BaseModel):
    client_secret: str
    amount: int
    currency: str
    plan_name: str
    publishable_key: str

class SubscriptionStatus(BaseModel):
    plan: str
    status: str
    current_period_end: Optional[str]
    cancel_at_period_end: bool

# ── Endpoints ─────────────────────────────────────────────────────

@router.post("/create-intent", response_model=CreateIntentResponse)
async def create_payment_intent(body: CreateIntentRequest):
    """
    Create a Stripe PaymentIntent for one-time plan subscription.
    Frontend uses the returned client_secret to confirm payment.
    """
    if not stripe.api_key:
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured. Add STRIPE_SECRET_KEY to your .env file."
        )

    plan = PLAN_PRICES.get(body.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan_id}")

    try:
        # Create or retrieve customer
        customer_id = None
        if body.email:
            customers = stripe.Customer.list(email=body.email, limit=1)
            if customers.data:
                customer_id = customers.data[0].id
            else:
                customer = stripe.Customer.create(email=body.email)
                customer_id = customer.id

        # Create PaymentIntent
        intent_params: dict = {
            "amount": plan["amount"],
            "currency": plan["currency"],
            "automatic_payment_methods": {"enabled": True},
            "metadata": {
                "plan_id": body.plan_id,
                "plan_name": plan["name"],
            },
        }
        if customer_id:
            intent_params["customer"] = customer_id

        intent = stripe.PaymentIntent.create(**intent_params)

        return CreateIntentResponse(
            client_secret=intent.client_secret,
            amount=plan["amount"],
            currency=plan["currency"],
            plan_name=plan["name"],
            publishable_key=os.getenv("STRIPE_PUBLISHABLE_KEY", ""),
        )

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e.user_message))


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
):
    """
    Handle Stripe webhook events (payment_intent.succeeded, etc.)
    Configure in Stripe Dashboard → Developers → Webhooks.
    """
    if not WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook secret not configured.")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    # ── Handle events ─────────────────────────────────────────────
    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        plan_id = intent.get("metadata", {}).get("plan_id", "unknown")
        customer = intent.get("customer")
        amount = intent.get("amount", 0) / 100
        print(f"✅ Payment succeeded: plan={plan_id}, customer={customer}, amount=${amount}")
        # TODO: update user plan in database, send confirmation email

    elif event["type"] == "payment_intent.payment_failed":
        intent = event["data"]["object"]
        err = intent.get("last_payment_error", {}).get("message", "Unknown error")
        print(f"❌ Payment failed: {err}")

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        print(f"🚫 Subscription cancelled: {subscription['id']}")

    return {"status": "ok", "event": event["type"]}


@router.get("/plans")
async def get_plans():
    """Return available plans and pricing."""
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price_usd": 0,
                "features": {
                    "api_calls_per_month": 1000,
                    "models": 1,
                    "deployments": 1,
                    "support": "community",
                },
            },
            {
                "id": "pro",
                "name": "Pro",
                "price_usd": 49,
                "features": {
                    "api_calls_per_month": 100000,
                    "models": 10,
                    "deployments": 5,
                    "support": "priority",
                    "custom_domains": True,
                },
            },
            {
                "id": "business",
                "name": "Business",
                "price_usd": 199,
                "features": {
                    "api_calls_per_month": 5000000,
                    "models": -1,  # unlimited
                    "deployments": -1,
                    "support": "24/7",
                    "sla": True,
                    "team_seats": 10,
                },
            },
        ],
        "rates": {
            "inference_per_1k_calls": 0.001,
            "gpu_training_per_hour": 0.45,
            "storage_per_gb_month": 0.023,
            "data_transfer_per_gb": 0.09,
        },
    }
