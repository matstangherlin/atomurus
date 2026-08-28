import assert from 'node:assert/strict';
import { accessForUser, publicUser, trialEndsAtForUser } from '../netlify/lib/plan-access.mjs';

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

const fresh = accessForUser({ createdAt: daysAgo(2), email: 'a@b.com' });
assert.equal(fresh.plan, 'paid');
assert.equal(fresh.planSource, 'trial');
assert.equal(fresh.adsFree, true);
assert.ok(fresh.trialEndsAt);

const expired = accessForUser({ createdAt: daysAgo(40), email: 'a@b.com' });
assert.equal(expired.plan, 'free');
assert.equal(expired.adsFree, false);

const paid = accessForUser({
  createdAt: daysAgo(40),
  appMetadata: { atomurus_plan: 'paid', subscription_status: 'active', subscription_currency: 'usd', subscription_interval: 'annual' }
});
assert.equal(paid.plan, 'paid');
assert.equal(paid.planSource, 'paid');
assert.equal(paid.features.premiumLessons, true);
assert.equal(paid.features.studyCloud, true);
assert.equal(paid.features.favorites, true);
assert.equal(paid.features.calculatorHistory, true);
assert.equal(paid.features.studyNotes, true);
assert.equal(paid.features.studyTags, true);
assert.equal(paid.features.studyProgress, true);
assert.equal(paid.features.studySets, true);
assert.equal(paid.features.flashcards, true);
assert.equal(paid.features.smartReview, true);
assert.equal(paid.features.studyInsights, true);
assert.equal(paid.features.focusReview, true);
assert.equal(paid.features.advancedStudyStats, true);
assert.equal(paid.features.spacedRepetition, true);
assert.equal(paid.features.proLab, true);
assert.equal(paid.features.advancedCalculations, true);
assert.equal(paid.features.advancedElementCompare, true);
assert.equal(paid.features.advancedMoleculeCompare, true);
assert.equal(paid.features.advancedAtomicCompare, true);
assert.equal(paid.features.savedLabSessions, true);
assert.equal(paid.features.chemistrySolver, true);
assert.equal(paid.features.reactionWorkbench, true);
assert.equal(paid.features.reactionBalancer, true);
assert.equal(paid.features.stoichiometrySolver, true);
assert.equal(paid.features.limitingReagentSolver, true);
assert.equal(paid.features.yieldSolver, true);
assert.equal(paid.features.formulaSolver, true);
assert.equal(paid.features.solutionBuilder, true);

const expiredStudy = accessForUser({ createdAt: daysAgo(40), email: 'a@b.com' });
assert.equal(expiredStudy.features.studyCloud, false);
assert.equal(expiredStudy.features.smartReview, false);
assert.equal(expiredStudy.features.studyInsights, false);
assert.equal(expiredStudy.features.focusReview, false);
assert.equal(expiredStudy.features.advancedStudyStats, false);
assert.equal(expiredStudy.features.studySets, false);
assert.equal(expiredStudy.features.proLab, false);
assert.equal(expiredStudy.features.advancedCalculations, false);
assert.equal(expiredStudy.features.advancedElementCompare, false);
assert.equal(expiredStudy.features.advancedMoleculeCompare, false);
assert.equal(expiredStudy.features.advancedAtomicCompare, false);
assert.equal(expiredStudy.features.savedLabSessions, false);
assert.equal(expiredStudy.features.chemistrySolver, false);
assert.equal(expiredStudy.features.reactionWorkbench, false);
assert.equal(expiredStudy.features.formulaSolver, false);
assert.equal(expiredStudy.features.solutionBuilder, false);

const trialStudy = accessForUser({ createdAt: daysAgo(2), email: 'a@b.com' });
assert.equal(trialStudy.features.studyCloud, true);
assert.equal(trialStudy.features.smartReview, true);
assert.equal(trialStudy.features.studyInsights, true);
assert.equal(trialStudy.features.focusReview, true);
assert.equal(trialStudy.features.advancedStudyStats, true);
assert.equal(trialStudy.features.proLab, true);
assert.equal(trialStudy.features.advancedCalculations, true);
assert.equal(trialStudy.features.advancedElementCompare, true);
assert.equal(trialStudy.features.advancedMoleculeCompare, true);
assert.equal(trialStudy.features.advancedAtomicCompare, true);
assert.equal(trialStudy.features.savedLabSessions, true);
assert.equal(trialStudy.features.chemistrySolver, true);
assert.equal(trialStudy.features.reactionWorkbench, true);
assert.equal(trialStudy.features.formulaSolver, true);
assert.equal(trialStudy.features.solutionBuilder, true);

const admin = accessForUser({ role: 'admin', createdAt: daysAgo(100) });
assert.equal(admin.plan, 'admin');
assert.equal(admin.adsFree, true);
assert.equal(admin.features.studyCloud, true);
assert.equal(admin.features.flashcards, true);
assert.equal(admin.features.studyInsights, true);
assert.equal(admin.features.focusReview, true);
assert.equal(admin.features.advancedStudyStats, true);
assert.equal(admin.features.proLab, true);
assert.equal(admin.features.advancedCalculations, true);
assert.equal(admin.features.advancedElementCompare, true);
assert.equal(admin.features.advancedMoleculeCompare, true);
assert.equal(admin.features.advancedAtomicCompare, true);
assert.equal(admin.features.savedLabSessions, true);
assert.equal(admin.features.chemistrySolver, true);
assert.equal(admin.features.reactionWorkbench, true);

const pub = publicUser({
  id: '1',
  email: 'x@y.com',
  confirmedAt: daysAgo(1),
  createdAt: daysAgo(1),
  appMetadata: { subscription_status: 'trialing', subscription_currency: 'brl', subscription_interval: 'monthly' }
});
assert.equal(pub.isPro, true);
assert.equal(pub.features.adsFree, true);
assert.equal(pub.subscriptionStatus, 'trialing');
assert.equal(pub.billingCurrency, 'brl');
assert.equal(pub.billingPeriod, 'monthly');

assert.ok(trialEndsAtForUser({ appMetadata: { atomurus_trial_ends_at: daysFromNow(10) } }));

const pastDue = accessForUser({
  createdAt: daysAgo(40),
  appMetadata: { subscription_status: 'past_due', stripe_customer_id: 'cus_x' }
});
assert.equal(pastDue.isPro, true);
assert.equal(pastDue.canManageBilling, true);

const canceledStatus = accessForUser({
  createdAt: daysAgo(40),
  appMetadata: { atomurus_plan: 'paid', subscription_status: 'canceled' }
});
assert.equal(canceledStatus.plan, 'free');
assert.equal(canceledStatus.features.studyCloud, false);
assert.equal(canceledStatus.features.proLab, false);

const memberPub = publicUser({
  id: '1',
  email: 'x@y.com',
  createdAt: daysAgo(40),
  appMetadata: { subscription_status: 'active', stripe_customer_id: 'cus_hidden' }
});
assert.equal(memberPub.stripeCustomerId, null);
assert.equal(memberPub.hasStripeCustomer, true);
assert.equal(memberPub.canManageBilling, true);

console.log('plan-access tests passed');
