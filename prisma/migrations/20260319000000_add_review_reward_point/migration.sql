-- Add review_reward to PointTransactionType enum
ALTER TYPE "PointTransactionType" ADD VALUE IF NOT EXISTS 'review_reward';
