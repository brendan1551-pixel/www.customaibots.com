#!/usr/bin/env bash
# Registers the three Shopify webhooks. Run once after deploying, with the .env values exported.
set -euo pipefail
for TOPIC in CHECKOUTS_CREATE CHECKOUTS_UPDATE ORDERS_CREATE; do
  jq -n --arg topic "$TOPIC" --arg uri "$APP_URL/api/webhooks/shopify" '{
    query: "mutation($topic: WebhookSubscriptionTopic!, $uri: String!) { webhookSubscriptionCreate(topic: $topic, webhookSubscription: { uri: $uri, format: JSON }) { webhookSubscription { id topic } userErrors { field message } } }",
    variables: { topic: $topic, uri: $uri }
  }' | curl -sS -X POST "https://$SHOPIFY_STORE/admin/api/$SHOPIFY_API_VERSION/graphql.json" \
      -H "X-Shopify-Access-Token: $SHOPIFY_ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      --data @- | jq
done

# List what is registered
jq -n '{ query: "{ webhookSubscriptions(first: 20) { nodes { id topic } } }" }' \
  | curl -sS -X POST "https://$SHOPIFY_STORE/admin/api/$SHOPIFY_API_VERSION/graphql.json" \
      -H "X-Shopify-Access-Token: $SHOPIFY_ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      --data @- | jq
