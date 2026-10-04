// lib/discount.ts
import { adminGraphql } from './shopify';

const CREATE_CODE = `#graphql
  mutation CreateRecoveryCode($input: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $input) {
      codeDiscountNode { id }
      userErrors { field message }
    }
  }`;

type Result = {
  discountCodeBasicCreate: { userErrors: { field: string[] | null; message: string }[] };
};

export async function createRecoveryDiscount(checkoutToken: string): Promise<string> {
  const code = `RECOVER10-${checkoutToken.slice(-6).toUpperCase()}`;
  const now = Date.now();

  const data = await adminGraphql<Result>(CREATE_CODE, {
    input: {
      title: code,
      code,
      startsAt: new Date(now).toISOString(),
      endsAt: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
      context: { all: 'ALL' }, // API 2025-04+; older: customerSelection: { all: true }
      customerGets: { value: { percentage: 0.1 }, items: { all: true } },
      minimumRequirement: { subtotal: { greaterThanOrEqualToSubtotal: '40.00' } },
      usageLimit: 1,
      appliesOncePerCustomer: true,
    },
  });

  // A retried job may find its code already created; treat that as success
  const errors = data.discountCodeBasicCreate.userErrors
    .filter((e) => !/unique|already been taken/i.test(e.message));
  if (errors.length) throw new Error(`Discount: ${JSON.stringify(errors)}`);
  return code;
}
