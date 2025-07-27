import React from 'react';
import { PageWrapper } from '../../shared/PageWrapper';
import styles from './WelcomeFriends.module.css';
import { useNavigate } from 'react-router-dom';
import { useMenuBlocksStore } from '../Home/MenuBlocks/MenuBlocksStore';

interface WelcomeFriendsProps {
    onInvite?: () => void;
}

export const WelcomeFriends: React.FC<WelcomeFriendsProps> = ({ onInvite }) => {
    const navigate = useNavigate();
    const { setFriendsWelcomeShown } = useMenuBlocksStore();
    
    const handleInvite = () => {
        // Сохраняем состояние в localStorage и store
        localStorage.setItem('friendsWelcomeComplete', '1');
        setFriendsWelcomeShown(true);
        
        if (onInvite) {
            onInvite();
        } else {
            navigate('/friends', { replace: true });
        }
    };

    return (
        <PageWrapper showBackButton>
            <div className={styles.root}>
                <div className={styles.header}>
                    <div className={styles.title}>You haven't invited any friends yet</div>
                    <div className={styles.subtitle}>
                        Invite friends to earn rewards and unlock exclusive features — it's easy and rewarding.
                    </div>
                </div>
                <div className={styles.imagePlaceholder} />
                <button className={styles.inviteButton} onClick={handleInvite}>
                    Invite Friends
                </button>
            </div>
        </PageWrapper>
    );
};