import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import styles from './Welcome.module.css';

const steps = [
  {
    title: 'Prayer Reminders',
    desc: 'Stay on track with timely reminders for every prayer throughout the day.',
  },
  {
    title: 'Read the Quran',
    desc: 'Access the full Quran anytime, anywhere. Beautifully organized and easy to navigate.',
  },
  {
    title: 'Scan Your Food',
    desc: 'Quickly check if a product is halal or haram by scanning it — clear answers in seconds.',
  },
  {
    title: 'Get Trusted Religious Answers',
    desc: 'Receive accurate, reliable responses to help you confidently understand your faith.',
  },
];

export const Welcome: React.FC = () => {
  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(false);
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show Welcome if onboardingComplete is not set
  useEffect(() => {
    if (localStorage.getItem('onboardingComplete')) {
      navigate('/home', { replace: true });
    }
    if (tg?.BackButton) tg.BackButton.hide();
  }, [navigate, tg]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let startX = 0;
    let endX = 0;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX;
      if (endX - startX > 60 && step > 0) {
        setStep(s => s - 1);
      } else if (startX - endX > 60 && step < steps.length - 1) {
        handleNext();
      }
    };
    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchend', onTouchEnd);
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [step]);

  const handleNext = async () => {
    setFade(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    if (step < steps.length - 1) {
      setStep(s => s + 1);
      setFade(false);
    } else {
      localStorage.setItem('onboardingComplete', '1');
      navigate('/home', { replace: true });
    }
  };

  // If onboardingComplete, don't render anything (redirect will happen)
  if (localStorage.getItem('onboardingComplete')) return null;

  return (
    <div ref={containerRef} className={styles.welcomeRoot}>
      <div className={styles.welcomeStep}>
        <div
          className={styles.welcomeTitle}
          style={{
            opacity: fade ? 0 : 1,
            transform: fade ? 'translateY(20px)' : 'translateY(0)',
          }}
        >
          {steps[step].title}
        </div>
        <div
          className={styles.welcomeDesc}
          style={{
            opacity: fade ? 0 : 1,
            transform: fade ? 'translateY(20px)' : 'translateY(0)',
          }}
        >
          {steps[step].desc}
        </div>
      </div>
      <div className={styles.welcomeBottom}>
        <div className={styles.welcomePagination}>
          {steps.map((_, i) => (
            <div
              key={i}
              className={
                i === step
                  ? `${styles.welcomeDot} ${styles.welcomeDotActive}`
                  : styles.welcomeDot
              }
            ></div>
          ))}
        </div>
        <button
          className={styles.welcomeButton}
          onClick={handleNext}
        >
          {step === steps.length - 1 ? 'Start' : 'Next'}
        </button>
      </div>
    </div>
  );
};