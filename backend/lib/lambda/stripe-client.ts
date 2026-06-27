import Stripe from 'stripe';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({ region: 'eu-west-1' });
let stripe: Stripe;

export async function getStripe(): Promise<Stripe> {
  if (stripe) return stripe;
  const r = await ssm.send(new GetParameterCommand({ Name: '/bedrawn/stripe/secret-key', WithDecryption: true }));
  stripe = new Stripe(r.Parameter!.Value!, { apiVersion: '2026-06-24.dahlia' });
  return stripe;
}

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type': 'application/json',
};
