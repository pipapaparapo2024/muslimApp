import React from 'react';
import { PageWrapper } from '../../shared/PageWrapper';
import styles from './Friends.module.css';

const inviteLink = 'https://ff6cd8e75312.ngrok-free.app'; // TODO: Replace with real invite link

export const Friends: React.FC = () => {
  // Example progress values
  const requestsProgress = 6;
  const requestsGoal = 10;
  const premiumProgress = 10;
  const premiumGoal = 10;

  const handleInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Muslim App!',
          text: 'Get rewards and unlock features by joining through my link!',
          url: inviteLink,
        });
      } catch (e) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(inviteLink);
      alert('Link copied!');
    }
  };

  return (
    <PageWrapper showBackButton>
      <div className={styles.friendsContainer}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <span role="img" aria-label="gift">🎁</span> Earn Rewards by Sharing
          </div>
          <div className={styles.cardDesc}>
            Invite friends and get exclusive bonuses — the more you share, the more you gain.
          </div>
          <button className={styles.inviteBtn} onClick={handleInvite}>Invite Friends</button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Get Free Requests</div>
          <div className={styles.cardDesc}>
            Earn free requests when {requestsGoal} invited friends take action in the app.
          </div>
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar} style={{ width: `${(requestsProgress/requestsGoal)*100}%` }} />
          </div>
          <div className={styles.progressLabel}>{requestsProgress}/{requestsGoal}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Unlock Premium for Free</div>
          <div className={styles.cardDesc}>
            Unlock Premium for free when {premiumGoal} invited friends make a purchase.
          </div>
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar} style={{ width: `${(premiumProgress/premiumGoal)*100}%`, background: '#111' }} />
          </div>
          <div className={styles.progressLabel}>{premiumProgress}/{premiumGoal}</div>
          <button className={styles.rewardBtn} disabled={premiumProgress < premiumGoal}>Get Reward</button>
        </div>
      </div>
    </PageWrapper>
  );
}; 